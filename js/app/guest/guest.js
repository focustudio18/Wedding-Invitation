import { video } from './video.js';
import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import * as confetti from '../../libs/confetti.js';
import { pool } from '../../connection/request.js';

export const guest = (() => {

    let information = null;
    let config = null;

    // 🔥 hapus semua kemungkinan elemen komentar
    const removeCommentUI = () => {
        // hapus container komentar (dua versi id)
        document.getElementById('comment')?.remove();
        document.getElementById('comments')?.remove();

        // hapus menu navigasi ke komentar (dua kemungkinan href)
        document
            .querySelector('a.nav-link[href="#comment"]')
            ?.closest('li.nav-item')
            ?.remove();

        document
            .querySelector('a.nav-link[href="#comments"]')
            ?.closest('li.nav-item')
            ?.remove();
    };

    const countDownDate = () => {
        const count = (new Date(
            document.body.getAttribute('data-time').replace(' ', 'T')
        )).getTime();

        const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

        const day = document.getElementById('day');
        const hour = document.getElementById('hour');
        const minute = document.getElementById('minute');
        const second = document.getElementById('second');

        const updateCountdown = () => {
            const distance = Math.abs(count - Date.now());

            day.textContent = pad(Math.floor(distance / 86400000));
            hour.textContent = pad(Math.floor((distance % 86400000) / 3600000));
            minute.textContent = pad(Math.floor((distance % 3600000) / 60000));
            second.textContent = pad(Math.floor((distance % 60000) / 1000));

            util.timeOut(updateCountdown, 1000 - (Date.now() % 1000));
        };

        util.timeOut(updateCountdown);
    };

    const showGuestName = () => {
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1].length >= 1) {
            name = window.decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');

            const template = `
                <small>${util.escapeHtml(guestName?.getAttribute('data-message'))}</small>
                <p style="font-size:1.25rem">${util.escapeHtml(name)}</p>
            `;

            util.safeInnerHTML(div, template);
            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }
    };

    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });
        document.getElementById('root').classList.remove('opacity-0');

        if (theme.isAutoMode()) {
            document.getElementById('button-theme').classList.remove('d-none');
        }

        confetti.basicAnimation();
        util.timeOut(confetti.openAnimation, 1500);

        document.dispatchEvent(new Event('undangan.open'));
        util.changeOpacity(document.getElementById('welcome'), false)
            .then(el => el.remove());
    };

    const modal = (img) => {
        document.getElementById('button-modal-click').href = img.src;
        document.getElementById('button-modal-download').dataset.src = img.src;

        const i = document.getElementById('show-modal-image');
        i.src = img.src;
        i.width = img.width;
        i.height = img.height;

        bs.modal('modal-image').show();
    };

    const showStory = (div) => {
        if (navigator.vibrate) navigator.vibrate(500);
        confetti.tapTapAnimation(div, 100);
        util.changeOpacity(div, false).then(e => e.remove());
    };

    const booting = async () => {
        // jaga-jaga, hapus lagi saat boot selesai
        removeCommentUI();

        // countDownDate();
        showGuestName();

        await util.changeOpacity(document.getElementById('welcome'), true);
        await util.changeOpacity(document.getElementById('loading'), false)
            .then(el => el.remove());
    };

    const pageLoaded = () => {
        lang.init();
        offline.init();
        progress.init();

        // langsung sapu bersih komentar begitu halaman siap
        removeCommentUI();

        config = storage('config');
        information = storage('information');

        const vid = video.init();
        const img = image.init();
        const aud = audio.init();
        const lib = loader();

        document.addEventListener('undangan.progress.done', booting);

        document.getElementById('button-modal-download')
            .addEventListener('click', e =>
                img.download(e.currentTarget.dataset.src)
            );

        vid.load();
        img.load();
        aud.load();

        lib({ confetti: document.body.getAttribute('data-confetti') === 'true' })
            .then(() => progress.complete('libs'))
            .catch(() => progress.invalid('libs'));
    };

    const init = () => {
        theme.init();
        session.init();

        // bersihkan jejak komentar lama di storage browser
        try {
            storage('comment')?.clear();
            localStorage.removeItem('comment');
        } catch (e) {}

        window.addEventListener('load', () => {
            pool.init(pageLoaded, ['image', 'video', 'audio', 'libs', 'gif']);
        });

        return {
            util,
            theme,
            guest: {
                open,
                modal,
                showStory,
            },
        };
    };

    return { init };
})();
