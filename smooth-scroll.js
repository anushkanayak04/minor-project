if (typeof Lenis !== 'undefined') {
    window.lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true
    });

    function raf(time) {
        window.lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
}
