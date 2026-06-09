import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app import models
from app.security import hash_password
from app.masking import encrypt_sensitive


def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                hashed_password=hash_password("admin123"),
                real_name_encrypted=encrypt_sensitive("系统管理员"),
                role=models.UserRole.ADMIN
            )
            db.add(admin)
            print("已创建管理员账户: admin / admin123")

        teacher = db.query(models.User).filter(models.User.username == "teacher1").first()
        if not teacher:
            teacher_class = models.Class(class_name="高三(1)班", grade="高三")
            db.add(teacher_class)
            db.flush()

            teacher = models.User(
                username="teacher1",
                hashed_password=hash_password("teacher123"),
                real_name_encrypted=encrypt_sensitive("张老师"),
                role=models.UserRole.TEACHER,
                class_id=teacher_class.id
            )
            teacher_class.head_teacher_id = teacher.id
            db.add(teacher)

            student_names = ["王同学", "李同学", "赵同学", "陈同学", "刘同学"]
            for i, name in enumerate(student_names, 1):
                student = models.User(
                    username=f"student{i:02d}",
                    hashed_password=hash_password("student123"),
                    real_name_encrypted=encrypt_sensitive(name),
                    role=models.UserRole.STUDENT,
                    class_id=teacher_class.id
                )
                db.add(student)
                print(f"已创建学生账户: student{i:02d} / student123")
            print("已创建教师账户: teacher1 / teacher123 (班级: 高三(1)班)")

        categories = [
            (models.FeedbackCategory.STRUCTURE, "v1.0", "分析文章的开头引入、段落划分、过渡衔接、结尾升华等结构要素。"),
            (models.FeedbackCategory.EVIDENCE, "v1.0", "评估论据的典型性、丰富度，以及叙议结合的分析深度。"),
            (models.FeedbackCategory.TYPO, "v1.0", "检测错别字、标点错误、乱码及重复字符等表层问题。"),
            (models.FeedbackCategory.EXPRESSION, "v1.0", "分析句式节奏、词汇丰富度、修辞运用及语言表达准确性。"),
        ]
        for cat, ver, desc in categories:
            pv = db.query(models.PromptVersion).filter(
                models.PromptVersion.category == cat,
                models.PromptVersion.version_code == ver
            ).first()
            if not pv:
                db.add(models.PromptVersion(
                    version_code=ver,
                    category=cat,
                    prompt_content=desc,
                    description=desc,
                    is_active=True,
                    created_by=admin.id if admin else 1
                ))

        db.commit()
        print("数据库初始化完成！")
    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
