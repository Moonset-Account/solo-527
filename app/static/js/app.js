document.addEventListener('htmx:afterRequest', function(event) {
    if (event.detail.xhr && event.detail.xhr.getResponseHeader('HX-Redirect')) {
        window.location.href = event.detail.xhr.getResponseHeader('HX-Redirect');
    }
});
