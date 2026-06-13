const routes: Record<string, string> = {
  'dashboard': '/dashboard',
  'home': '/',
  'login': '/login',
  'logout': '/logout',
  'leads.index': '/leads',
  'leads.create': '/leads/create',
  'leads.store': '/leads',
  'leads.show': '/leads/{lead}',
  'leads.edit': '/leads/{lead}/edit',
  'leads.update': '/leads/{lead}',
  'leads.consultations.store': '/leads/{lead}/consultations',
  'leads.response-nodes.store': '/leads/{lead}/response-nodes',
  'quote-versions.index': '/quote-versions',
  'ocean-rules.index': '/ocean-rules',
  'churn-reasons.index': '/churn-reasons',
  'batch.validate': '/batch/validate',
  'batch.process': '/batch/process',
  'exports.leads': '/exports/leads',
  'exports.lead-quality': '/exports/lead-quality',
};

interface RouteParams {
  [key: string]: string | number;
}

export function route(name: string, params: RouteParams = {}): string {
  let path = routes[name];
  if (!path) {
    console.warn(`Route "${name}" not found`);
    return `/${name}`;
  }
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, String(value));
  });
  return path;
}

export function routeWithQuery(name: string, params: RouteParams = {}, query: Record<string, any> = {}): string {
  const path = route(name, params);
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return v.map(item => `${encodeURIComponent(k)}[]=${encodeURIComponent(String(item))}`).join('&');
      }
      return `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
    })
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

export default route;
