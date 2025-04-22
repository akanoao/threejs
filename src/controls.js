// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get the SVG paths
    const porschePath = document.getElementById("porsche");
    const p911Path = document.getElementById("p911");
    const clipPathId = "clip-00";

    // Get the clipPath element
    const clipPath = document.querySelector(`#${clipPathId}`);

    // Clone both paths to use in the clipPath
    const porscheClone = porschePath.cloneNode(true);
    porscheClone.id = "porsche-clip";

    const p911Clone = p911Path.cloneNode(true);
    p911Clone.id = "p911-clip";

    // Initialize clipPath with the first path (Porsche)
    clipPath.innerHTML = "";
    clipPath.appendChild(porscheClone);

    // Set up the scroll-controlled switching
    function setupSwitching() {
        // Our switch point is at 40% scroll
        const switchPoint = 0.5;

        // Function to update the clipPath based on scroll position
        function updateClipPathOnScroll() {
            // Calculate how far we've scrolled (0-1)
            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            let scrollFraction = scrollTop / 368;
            scrollFraction = Math.max(0, Math.min(1, scrollFraction));

            // Switch the clipPath element based on scroll position
            if (scrollFraction < switchPoint) {
                // Remove current content and add the Porsche path
                clipPath.innerHTML = "";
                clipPath.appendChild(porscheClone);
            } else {
                // Remove current content and add the 911 path
                clipPath.innerHTML = "";
                clipPath.appendChild(p911Clone);
            }

            // For debugging
            console.log(
                `Scroll: ${scrollFraction.toFixed(2)}, Using: ${
                    scrollFraction < switchPoint ? "PORSCHE" : "911"
                }`
            );
        }
        function modelMove() {}
        // Listen for scroll events
        window.addEventListener("scroll", () => {
            updateClipPathOnScroll();
            modelMove();
        });

        // Initial update
        updateClipPathOnScroll();

        // Update on resize
        window.addEventListener("resize", () => {
            updateClipPathOnScroll();
        });
    }

    // Initialize
    setupSwitching();

    // Add a debugging indicator
    function addDebugger() {
        const debugDiv = document.createElement("div");
        debugDiv.style.position = "fixed";
        debugDiv.style.top = "10px";
        debugDiv.style.right = "10px";
        debugDiv.style.background = "rgba(0,0,0,0.7)";
        debugDiv.style.color = "white";
        debugDiv.style.padding = "10px";
        debugDiv.style.zIndex = "9999";
        debugDiv.style.fontFamily = "monospace";
        document.body.appendChild(debugDiv);

        window.addEventListener("scroll", () => {
            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = ((scrollTop / maxScroll) * 100).toFixed(2);
            const currentLogo = scrollPercent < 50 ? "PORSCHE" : "911";
            debugDiv.textContent = `Scroll: ${scrollPercent}% | Logo: ${currentLogo}`;
        });
    }

    // Enable debugging
    addDebugger();
});
