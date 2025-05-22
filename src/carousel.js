document.addEventListener("DOMContentLoaded", function () {
    // Carousel elements
    const carousel = document.querySelector(".carousel");
    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".dot");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const carouselContainer = document.querySelector(".carousel-container");

    let currentIndex = 0;
    const slideWidth = 100; // percentage
    const totalSlides = slides.length;

    // Dragging Variables
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    let currentPosition = 0;

    // Initialize carousel
    updateCarousel();

    // Toggle description functionality
    const toggleBtns = document.querySelectorAll(".toggle-btn");
    toggleBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            const description = this.previousElementSibling;
            const isCollapsed = description.classList.contains("collapsed");

            // Toggle description visibility
            description.classList.toggle("collapsed");

            // Update button text
            this.textContent = isCollapsed ? "Show less" : "Show more";

            // Update button icon orientation
            this.classList.toggle("show-more", !isCollapsed);
        });

        // Set initial button text based on description state
        const description = btn.previousElementSibling;
        const isCollapsed = description.classList.contains("collapsed");
        btn.textContent = isCollapsed ? "Show more" : "Show less";
        btn.classList.toggle("show-more", isCollapsed);
    });

    // Navigation buttons
    prevBtn.addEventListener("click", () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
        updateCarousel();
    });

    nextBtn.addEventListener("click", () => {
        currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
        updateCarousel();
    });

    // Pagination dots
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            currentIndex = index;
            updateCarousel();
        });
    });

    // Update carousel position and active dot
    function updateCarousel() {
        prevTranslate = currentIndex * -slideWidth;
        currentTranslate = prevTranslate;
        setSliderPosition();

        // Update active dot
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });
    }

    // Draggable functionality
    function touchStart(event) {
        if (event.type === "touchstart") {
            startPos = event.touches[0].clientX;
        } else {
            startPos = event.clientX;

            // Prevent default drag behavior
            event.preventDefault();
        }

        isDragging = true;
        animationID = requestAnimationFrame(animation);
        carousel.style.transition = "none";
    }

    function touchMove(event) {
        if (isDragging) {
            let currentPosition = 0;
            if (event.type === "touchmove") {
                currentPosition = event.touches[0].clientX;
            } else {
                currentPosition = event.clientX;
            }

            const diff = currentPosition - startPos;
            const containerWidth = carouselContainer.offsetWidth;
            const movePercent = (diff / containerWidth) * 100;

            // Update the current translate with the movement amount
            currentTranslate = prevTranslate + movePercent;
        }
    }

    function touchEnd() {
        isDragging = false;
        cancelAnimationFrame(animationID);

        // Calculate which slide to snap to
        const movedPercent = currentTranslate - prevTranslate;

        // Threshold for changing slides (20% of slide width)
        const threshold = 20;

        if (movedPercent > threshold && currentIndex > 0) {
            // Moved right enough to go to previous slide
            currentIndex--;
        } else if (
            movedPercent < -threshold &&
            currentIndex < slides.length - 1
        ) {
            // Moved left enough to go to next slide
            currentIndex++;
        }

        // Enable transition for the snap effect
        carousel.style.transition = "transform 0.3s ease";
        updateCarousel();
    }

    function animation() {
        setSliderPosition();
        if (isDragging) {
            requestAnimationFrame(animation);
        }
    }

    function setSliderPosition() {
        // Limit maximum drag beyond first and last slides
        const maxDrag = 25; // in percentage

        if (currentIndex === 0 && currentTranslate > 0) {
            currentTranslate = Math.min(currentTranslate, maxDrag);
        } else if (
            currentIndex === slides.length - 1 &&
            currentTranslate < prevTranslate
        ) {
            currentTranslate = Math.max(
                currentTranslate,
                prevTranslate - maxDrag
            );
        }

        carousel.style.transform = `translateX(${currentTranslate}%)`;
    }

    // Event Listeners for mouse and touch events
    carouselContainer.addEventListener("mousedown", touchStart);
    carouselContainer.addEventListener("touchstart", touchStart);
    carouselContainer.addEventListener("mousemove", touchMove);
    carouselContainer.addEventListener("touchmove", touchMove);
    carouselContainer.addEventListener("mouseup", touchEnd);
    carouselContainer.addEventListener("touchend", touchEnd);
    carouselContainer.addEventListener("mouseleave", touchEnd);

    // Prevent context menu on right-click
    carouselContainer.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Event listeners for toggle buttons to prevent drag interaction
    toggleBtns.forEach((btn) => {
        btn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        btn.addEventListener("touchstart", (e) => {
            e.stopPropagation();
        });
    });

    // Prevent dragging from interfering with dots or arrows
    const nonDraggableElements = [
        ...document.querySelectorAll(".dot"),
        ...document.querySelectorAll(".arrow"),
    ];
    nonDraggableElements.forEach((el) => {
        el.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        el.addEventListener("touchstart", (e) => {
            e.stopPropagation();
        });
    });
});
