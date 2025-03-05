window.onload = function () {
    const hideTryItOutForPost = () => {
        document.querySelectorAll('.opblock-post .try-out').forEach(btn => {
            btn.style.display = 'none';
        });
    };

    const observer = new MutationObserver(hideTryItOutForPost);
    observer.observe(document.body, { childList: true, subtree: true });

    hideTryItOutForPost();
};
