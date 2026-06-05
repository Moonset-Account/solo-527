import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";

interface Field {
  id: string;
  name: string;
  area: number;
  location: string;
  soil_type: string;
  owner_id: string;
  owner_name: string;
}

const soilTypeLabels: Record<string, string> = {
  '壤土': '壤土',
  '沙壤土': '沙壤土',
  '黏土': '黏土',
  '砂土': '砂土',
};

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    fields: [] as Field[],
    loading: true,
  });

  const loadFields = $(async () => {
    try {
      const response = await apiClient.get('/fields');
      state.fields = response.data;
    } catch (e) {
      console.error('加载地块失败', e);
    } finally {
      state.loading = false;
    }
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    await loadFields();
  });

  return (
    <Layout title="地块管理">
      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.fields.map((field) => (
            <div key={field.id} class="card hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-soil-100 rounded-xl flex items-center justify-center text-2xl">
                  🌾
                </div>
                <span class="text-sm text-gray-500">{field.area} 亩</span>
              </div>
              
              <h3 class="font-bold text-gray-800 mb-1">{field.name}</h3>
              <p class="text-sm text-gray-500 mb-3">{field.location}</p>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">土壤类型</span>
                  <span class="text-gray-700">{soilTypeLabels[field.soil_type] || field.soil_type}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">所有者</span>
                  <span class="text-gray-700">{field.owner_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
});
