const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['home', 'awards', 'experience', 'publications'];

function initCarouselSingle({ trackId, imgDir, files, intervalMs }) {
  const track = document.getElementById(trackId);
  if (!track) {
    console.error('[carousel] missing track element:', trackId);
    return;
  }
  if (!files || files.length === 0) {
    console.error('[carousel] empty files for:', trackId, files);
    return;
  }

  // Build items once
  track.innerHTML = files.map(f => `
    <div class="carousel-item-single">
      <img src="${imgDir}${encodeURIComponent(f)}" alt="">
    </div>
  `).join('');

  const items = Array.from(track.querySelectorAll('.carousel-item-single'));
  let idx = 0;

  const render = () => {
  const n = items.length;
  const prevIdx = (idx - 1 + n) % n;
  const nextIdx = (idx + 1) % n;

  items.forEach((el, i) => {
    el.classList.remove('prev', 'active', 'next');
    if (i === prevIdx) el.classList.add('prev');
    else if (i === idx) el.classList.add('active');
    else if (i === nextIdx) el.classList.add('next');
  });
};


  const next = () => {
    idx = (idx + 1) % items.length;   // closed loop
    render();
  };

  const prev = () => {
    idx = (idx - 1 + items.length) % items.length; // closed loop
    render();
  };

  // Initial render
  render();

  // Buttons (closed loop)
  document.querySelectorAll(`.carousel-btn[data-target="${trackId}"]`).forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('data-action') === 'prev') prev();
      else next();
    });
  });

  // Auto slide (optional)
  let timer = null;
  if (intervalMs && intervalMs > 0) {
    timer = setInterval(next, intervalMs);

    // Pause on hover (desktop friendly)
    track.addEventListener('mouseenter', () => timer && clearInterval(timer));
    track.addEventListener('mouseleave', () => timer = setInterval(next, intervalMs));
  }
}


function initCarousel({ trackId, imgDir, files, intervalMs }) {
    const track = document.getElementById(trackId);

    // DEBUG: tell us exactly what's missing
    if (!track) {
        console.error('[carousel] missing track element:', trackId);
        return;
    }
    if (!files || files.length === 0) {
        console.error('[carousel] empty files for:', trackId, files);
        return;
    }

    console.log('[carousel] render', trackId, 'count=', files.length, 'dir=', imgDir);


    // build DOM
    track.innerHTML = files.map(f => `
    <div class="carousel-item">
      <img src="${imgDir}${encodeURIComponent(f)}" alt="">
    </div>
  `).join('');

    const step = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (max <= 0) return;
        const next = Math.min(track.scrollLeft + track.clientWidth, max);
        track.scrollLeft = (next >= max) ? 0 : next;
    };

    // auto slide
    let timer = setInterval(step, intervalMs);

    // buttons
    document.querySelectorAll(`.carousel-btn[data-target="${trackId}"]`).forEach(btn => {
        btn.addEventListener('click', () => {
            clearInterval(timer);
            const dir = btn.getAttribute('data-action');
            const max = track.scrollWidth - track.clientWidth;
            if (dir === 'prev') {
                track.scrollLeft = Math.max(track.scrollLeft - track.clientWidth, 0);
            } else {
                track.scrollLeft = (track.scrollLeft >= max) ? 0 : Math.min(track.scrollLeft + track.clientWidth, max);
            }
            timer = setInterval(step, intervalMs);
        });
    });
}


window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });


    // Yaml
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    document.getElementById(key).innerHTML = yml[key];
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString())
                }

            })
            console.log('[yml] show-images =', yml['show-images']);
            // --- Render Show carousel ---
            initCarouselSingle({
  trackId: 'show-track',
  imgDir: 'static/assets/show/',
  files: yml['show-images'] || [],
  intervalMs: 2500   // 想关闭自动轮播就改成 0
});

        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
    section_names.forEach((name, idx) => {
        fetch(content_dir + name + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                document.getElementById(name + '-md').innerHTML = html;
            }).then(() => {
                // MathJax
                MathJax.typeset();
            })
            .catch(error => console.log(error));
    })

});
