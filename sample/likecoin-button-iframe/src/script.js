// postmessage to update referrer, useful for updating SPA
var likecoinButtonIframe = document.getElementsByTagName('iframe')[0];
likecoinButtonIframe.addEventListener('load', function() {
  likecoinButtonIframe.contentWindow.postMessage({ action: 'SET_REFERRER', content: { referrer: window.location.href }}, 'https://button.like.co');
})