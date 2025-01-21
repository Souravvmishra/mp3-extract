(function () {
    if (document.getElementById('fsb-btn')) return;

    // Parse URL Parameters for Customization
    const script = document.currentScript;
    const params = new URLSearchParams(script.src.split('?')[1] || '');

    const buttonText = params.get('text') || '+';
    const buttonColor = params.get('color') || '#6200EA';
    const textColor = params.get('textColor') || '#fff';
    const position = params.get('position') || 'bottom-right';
    const apiEndpoint = params.get('action') || null;

    // Create Button
    const fab = document.createElement('button');
    fab.id = 'fsb-btn';
    fab.style.position = 'fixed';
    fab.style.width = '60px';
    fab.style.height = '60px';
    fab.style.backgroundColor = buttonColor;
    fab.style.color = textColor;
    fab.style.borderRadius = '50%';
    fab.style.border = 'none';
    fab.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    fab.style.cursor = 'pointer';
    fab.style.zIndex = '1000';
    fab.innerText = buttonText;

    // Positioning
    if (position === 'bottom-right') {
        fab.style.bottom = '20px';
        fab.style.right = '20px';
    } else if (position === 'bottom-left') {
        fab.style.bottom = '20px';
        fab.style.left = '20px';
    } else if (position === 'top-right') {
        fab.style.top = '20px';
        fab.style.right = '20px';
    } else if (position === 'top-left') {
        fab.style.top = '20px';
        fab.style.left = '20px';
    }

    // Button Action
    fab.onclick = async function () {
        if (apiEndpoint) {
            try {
                const response = await fetch(apiEndpoint);
                const data = await response.json();
                alert(data.message || 'Action completed!');
            } catch (error) {
                console.log(error);
                alert('Action failed!');
            }
        } else {
            alert('Floating Action Button Clicked!');
        }
    };

    // Append Button
    document.body.appendChild(fab);
})();
