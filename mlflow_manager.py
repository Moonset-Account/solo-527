import os
import json
import joblib
import tempfile
import shutil
import logging
from datetime import datetime
from typing import Dict, Optional, Tuple, List
from config import Config
from database import Database, ModelVersion
from model_trainer import AnomalyModelTrainer


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MLflowModelManager:
    MODEL_NAME = "sensor_anomaly_classifier"
    LOCAL_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    LOCAL_REGISTRY_FILE = os.path.join(LOCAL_MODEL_DIR, "model_registry.json")

    def __init__(self):
        self._mlflow_available = False
        self._client = None
        self._init_mlflow()
        self._ensure_local_dirs()

    def _init_mlflow(self):
        try:
            import mlflow
            import mlflow.sklearn
            from mlflow.tracking import MlflowClient

            mlflow.set_tracking_uri(Config.MLFLOW_TRACKING_URI)
            mlflow.set_registry_uri(Config.MLFLOW_MODEL_REGISTRY_URI)

            self._client = MlflowClient()
            self._mlflow = mlflow
            self._mlflow_available = True
            logger.info("MLflow initialized successfully")
        except Exception as e:
            logger.warning(f"MLflow initialization failed, using local registry: {e}")
            self._mlflow_available = False
            self._client = None

    def _ensure_local_dirs(self):
        os.makedirs(self.LOCAL_MODEL_DIR, exist_ok=True)
        if not os.path.exists(self.LOCAL_REGISTRY_FILE):
            with open(self.LOCAL_REGISTRY_FILE, "w") as f:
                json.dump({"models": {}, "deployed_version": None}, f)

    def _read_local_registry(self) -> Dict:
        try:
            with open(self.LOCAL_REGISTRY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {"models": {}, "deployed_version": None}

    def _write_local_registry(self, data: Dict):
        with open(self.LOCAL_REGISTRY_FILE, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def register_model(
        self,
        trainer: AnomalyModelTrainer,
        training_result: Dict,
        trained_by: str = "system"
    ) -> Tuple[str, str]:
        model_version = training_result["model_version"]
        data_version = training_result["data_version"]
        test_metrics = training_result["test_metrics"]

        run_id = None
        model_uri = None

        if self._mlflow_available:
            try:
                run_id, model_uri = self._register_with_mlflow(
                    trainer, training_result
                )
            except Exception as e:
                logger.warning(f"MLflow registration failed, falling back to local: {e}")
                model_uri = self._save_local_model(trainer, training_result)
        else:
            model_uri = self._save_local_model(trainer, training_result)

        self._save_model_to_db(
            model_version=model_version,
            mlflow_run_id=run_id,
            model_uri=model_uri,
            training_result=training_result,
            trained_by=trained_by
        )

        return model_version, model_uri

    def _register_with_mlflow(
        self,
        trainer: AnomalyModelTrainer,
        training_result: Dict
    ) -> Tuple[str, str]:
        experiment_name = Config.MLFLOW_EXPERIMENT_NAME
        try:
            experiment = self._client.get_experiment_by_name(experiment_name)
            if experiment is None:
                self._mlflow.create_experiment(
                    experiment_name,
                    artifact_location=Config.MLFLOW_ARTIFACT_ROOT
                )
        except Exception as e:
            logger.warning(f"Experiment creation warning: {e}")

        self._mlflow.set_experiment(experiment_name)

        with self._mlflow.start_run(run_name=training_result["model_version"]) as run:
            run_id = run.info.run_id

            params = {
                "model_type": training_result["model_type"],
                "model_version": training_result["model_version"],
                "data_version": training_result["data_version"],
                "total_samples": training_result["dataset_info"]["total_samples"],
                "feature_count": training_result["dataset_info"]["feature_count"],
            }
            self._mlflow.log_params(params)

            test_metrics = training_result["test_metrics"]
            metrics = {
                "test_accuracy": test_metrics["accuracy"],
                "test_precision_macro": test_metrics["precision_macro"],
                "test_recall_macro": test_metrics["recall_macro"],
                "test_f1_macro": test_metrics["f1_macro"],
                "test_roc_auc": test_metrics["roc_auc"],
                "cv_f1_macro_mean": training_result["cv_metrics"]["cv_f1_macro_mean"],
            }
            self._mlflow.log_metrics(metrics)

            train_metrics = training_result["train_metrics"]
            train_metric_tags = {
                "train_accuracy": train_metrics["accuracy"],
                "train_f1_macro": train_metrics["f1_macro"],
            }
            for k, v in train_metric_tags.items():
                self._mlflow.log_metric(k, v, step=0)

            feature_importance = trainer.get_feature_importance()
            if feature_importance:
                fi_path = os.path.join(tempfile.mkdtemp(), "feature_importance.json")
                with open(fi_path, "w") as f:
                    json.dump(feature_importance, f, indent=2)
                self._mlflow.log_artifact(fi_path)

            metrics_path = os.path.join(tempfile.mkdtemp(), "training_result.json")
            with open(metrics_path, "w") as f:
                json.dump(training_result, f, indent=2, default=str, ensure_ascii=False)
            self._mlflow.log_artifact(metrics_path)

            class_names = training_result["label_classes"]
            model_info = self._mlflow.sklearn.log_model(
                sk_model=trainer.pipeline,
                artifact_path="model",
                registered_model_name=self.MODEL_NAME,
                pip_requirements=[
                    f"scikit-learn>=1.3.0",
                    f"numpy>=1.24.0",
                    f"scipy>=1.11.0",
                    f"joblib>=1.3.0",
                ],
                metadata={
                    "feature_names": trainer.feature_names,
                    "label_classes": class_names,
                    "model_version": training_result["model_version"],
                    "data_version": training_result["data_version"],
                }
            )

            try:
                latest_versions = self._client.get_latest_versions(self.MODEL_NAME)
                if latest_versions:
                    version_num = str(max(int(v.version) for v in latest_versions))
                    self._client.set_model_version_tag(
                        name=self.MODEL_NAME,
                        version=version_num,
                        key="model_version_str",
                        value=training_result["model_version"]
                    )
            except Exception as e:
                logger.warning(f"Setting model version tag failed: {e}")

        model_uri = f"models:/{self.MODEL_NAME}/{version_num if 'version_num' in locals() else 'latest'}"
        return run_id, model_uri

    def _save_local_model(
        self,
        trainer: AnomalyModelTrainer,
        training_result: Dict
    ) -> str:
        version = training_result["model_version"]
        model_dir = os.path.join(self.LOCAL_MODEL_DIR, version)
        os.makedirs(model_dir, exist_ok=True)

        pipeline_path = os.path.join(model_dir, "pipeline.joblib")
        joblib.dump(trainer.pipeline, pipeline_path)

        meta_path = os.path.join(model_dir, "metadata.json")
        metadata = {
            "feature_names": trainer.feature_names,
            "label_classes": training_result["label_classes"],
            "model_version": version,
            "data_version": training_result["data_version"],
            "model_type": training_result["model_type"],
            "metrics": training_result["test_metrics"],
            "created_at": datetime.now().isoformat()
        }
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        result_path = os.path.join(model_dir, "training_result.json")
        with open(result_path, "w") as f:
            json.dump(training_result, f, indent=2, default=str, ensure_ascii=False)

        registry = self._read_local_registry()
        registry["models"][version] = {
            "model_path": model_dir,
            "pipeline_path": pipeline_path,
            "metadata": metadata,
            "is_deployed": False,
            "created_at": datetime.now().isoformat()
        }
        self._write_local_registry(registry)

        return f"local://{model_dir}"

    def _save_model_to_db(
        self,
        model_version: str,
        mlflow_run_id: Optional[str],
        model_uri: str,
        training_result: Dict,
        trained_by: str
    ):
        session = Database.get_session()
        try:
            test_metrics = training_result["test_metrics"]
            model_record = ModelVersion(
                model_name=self.MODEL_NAME,
                version=model_version,
                mlflow_run_id=mlflow_run_id,
                mlflow_model_uri=model_uri,
                training_data_version=training_result["data_version"],
                accuracy=test_metrics["accuracy"],
                precision_score=test_metrics["precision_macro"],
                recall_score=test_metrics["recall_macro"],
                f1_score=test_metrics["f1_macro"],
                metrics=training_result,
                feature_names=training_result["feature_names"],
                is_deployed=False,
                description=training_result.get("description", ""),
                trained_by=trained_by
            )
            session.add(model_record)
            session.commit()
            logger.info(f"Model {model_version} saved to database")
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to save model to DB: {e}")
            raise e
        finally:
            session.close()

    def deploy_model(self, model_version: str) -> bool:
        session = Database.get_session()
        try:
            session.query(ModelVersion).filter(
                ModelVersion.model_name == self.MODEL_NAME
            ).update({"is_deployed": False})

            target = session.query(ModelVersion).filter(
                ModelVersion.version == model_version
            ).first()
            if target:
                target.is_deployed = True
                session.commit()
            else:
                raise ValueError(f"Model version {model_version} not found")

            if self._mlflow_available:
                try:
                    latest_versions = self._client.get_latest_versions(self.MODEL_NAME)
                    for v in latest_versions:
                        tags = {t.key: t.value for t in v.tags}
                        if tags.get("model_version_str") == model_version:
                            self._client.transition_model_version_stage(
                                name=self.MODEL_NAME,
                                version=v.version,
                                stage="Production"
                            )
                        else:
                            self._client.transition_model_version_stage(
                                name=self.MODEL_NAME,
                                version=v.version,
                                stage="Archived"
                            )
                except Exception as e:
                    logger.warning(f"MLflow stage transition failed: {e}")

            registry = self._read_local_registry()
            for v, info in registry["models"].items():
                info["is_deployed"] = (v == model_version)
            registry["deployed_version"] = model_version
            self._write_local_registry(registry)

            logger.info(f"Model {model_version} deployed successfully")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to deploy model: {e}")
            raise e
        finally:
            session.close()

    def get_deployed_model(self) -> Optional[Tuple[object, Dict]]:
        session = Database.get_session()
        try:
            deployed = session.query(ModelVersion).filter(
                ModelVersion.model_name == self.MODEL_NAME,
                ModelVersion.is_deployed == True
            ).first()

            if not deployed:
                all_models = session.query(ModelVersion).filter(
                    ModelVersion.model_name == self.MODEL_NAME
                ).order_by(ModelVersion.created_at.desc()).first()
                if all_models:
                    deployed = all_models
                    deployed.is_deployed = True
                    session.commit()

            if not deployed:
                return None

            version = deployed.version
            return self._load_model(version)
        finally:
            session.close()

    def _load_model(self, version: str) -> Optional[Tuple[object, Dict]]:
        if self._mlflow_available:
            try:
                model_uri = f"models:/{self.MODEL_NAME}/{version}"
                try:
                    import mlflow.sklearn
                    pipeline = mlflow.sklearn.load_model(model_uri)
                    run_id = None
                    session = Database.get_session()
                    try:
                        mv = session.query(ModelVersion).filter(
                            ModelVersion.version == version
                        ).first()
                        if mv:
                            run_id = mv.mlflow_run_id
                            metadata = {
                                "feature_names": mv.feature_names if isinstance(mv.feature_names, list) else json.loads(mv.feature_names) if mv.feature_names else [],
                                "label_classes": ["正常", "传感器漂移", "轴承磨损"],
                                "model_version": version,
                            }
                        else:
                            metadata = {}
                    finally:
                        session.close()
                    return pipeline, metadata
                except Exception as e:
                    logger.warning(f"Failed to load from MLflow: {e}")
            except Exception as e:
                logger.warning(f"MLflow load attempt failed: {e}")

        registry = self._read_local_registry()
        if version in registry["models"]:
            model_info = registry["models"][version]
            pipeline = joblib.load(model_info["pipeline_path"])
            return pipeline, model_info["metadata"]

        model_dir = os.path.join(self.LOCAL_MODEL_DIR, version)
        if os.path.exists(model_dir):
            meta_path = os.path.join(model_dir, "metadata.json")
            pipeline_path = os.path.join(model_dir, "pipeline.joblib")
            if os.path.exists(meta_path) and os.path.exists(pipeline_path):
                with open(meta_path, "r") as f:
                    metadata = json.load(f)
                pipeline = joblib.load(pipeline_path)
                return pipeline, metadata

        return None

    def list_model_versions(self) -> List[Dict]:
        session = Database.get_session()
        try:
            models = session.query(ModelVersion).filter(
                ModelVersion.model_name == self.MODEL_NAME
            ).order_by(ModelVersion.created_at.desc()).all()

            result = []
            for m in models:
                result.append({
                    "id": m.id,
                    "model_name": m.model_name,
                    "version": m.version,
                    "mlflow_run_id": m.mlflow_run_id,
                    "mlflow_model_uri": m.mlflow_model_uri,
                    "training_data_version": m.training_data_version,
                    "accuracy": m.accuracy,
                    "precision_score": m.precision_score,
                    "recall_score": m.recall_score,
                    "f1_score": m.f1_score,
                    "is_deployed": m.is_deployed,
                    "description": m.description,
                    "trained_by": m.trained_by,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                })
            return result
        finally:
            session.close()

    def get_model_detail(self, version: str) -> Optional[Dict]:
        session = Database.get_session()
        try:
            m = session.query(ModelVersion).filter(
                ModelVersion.version == version
            ).first()
            if not m:
                return None

            metrics = m.metrics if isinstance(m.metrics, dict) else (
                json.loads(m.metrics) if m.metrics else {}
            )
            feature_names = m.feature_names if isinstance(m.feature_names, list) else (
                json.loads(m.feature_names) if m.feature_names else []
            )

            return {
                "id": m.id,
                "model_name": m.model_name,
                "version": m.version,
                "mlflow_run_id": m.mlflow_run_id,
                "mlflow_model_uri": m.mlflow_model_uri,
                "training_data_version": m.training_data_version,
                "accuracy": m.accuracy,
                "precision_score": m.precision_score,
                "recall_score": m.recall_score,
                "f1_score": m.f1_score,
                "metrics": metrics,
                "feature_names": feature_names,
                "is_deployed": m.is_deployed,
                "description": m.description,
                "trained_by": m.trained_by,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
        finally:
            session.close()
