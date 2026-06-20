import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import AlertList from "@/pages/AlertList";
import AlertDetail from "@/pages/AlertDetail";
import StrategyList from "@/pages/StrategyList";
import StrategyForm from "@/pages/StrategyForm";
import RevenuePage from "@/pages/RevenuePage";
import SubsidyList from "@/pages/SubsidyList";
import MeterList from "@/pages/MeterList";

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<AlertList />} />
              <Route path="/alerts/:id" element={<AlertDetail />} />
              <Route path="/strategies" element={<StrategyList />} />
              <Route path="/strategies/create" element={<StrategyForm />} />
              <Route path="/strategies/:id/edit" element={<StrategyForm />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/subsidies" element={<SubsidyList />} />
              <Route path="/meters" element={<MeterList />} />
            </Route>
          </Routes>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}
