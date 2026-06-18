<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>服务器告警值班响应系统</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet">
    {{--@routes--}}
    <script>
        window.Ziggy = {
            url: '{{ url('/') }}',
            port: null,
            defaults: {},
            routes: {{ json_encode(app('routes')->getRoutesByName()) }}
        };
        window.route = function(name, params, absolute) {
            const routes = window.Ziggy.routes;
            if (!routes[name]) return '#';
            let uri = routes[name].uri;
            if (params) {
                Object.keys(params).forEach(key => {
                    uri = uri.replace('{' + key + '}', params[key]);
                });
            }
            uri = uri.replace(/\{[a-zA-Z_]+\?\}/g, '');
            return (absolute !== false ? window.Ziggy.url : '') + '/' + uri.replace(/^\/+/, '');
        };
    </script>
    @vite(['resources/js/app.js', "resources/js/Pages/{$page['component']}.vue"])
    @inertiaHead
</head>
<body class="font-sans antialiased bg-gray-50">
    @inertia
</body>
</html>
