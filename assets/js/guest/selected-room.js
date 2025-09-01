// Load header/footer if needed
fetch('pages/header.html').then(r => r.text()).then(h => document.getElementById('header-placeholder').innerHTML = h);
fetch('pages/footer.html').then(r => r.text()).then(h => document.getElementById('footer-placeholder').innerHTML = h);

document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const typeName = params.get('type');
    const container = document.getElementById('roomDetailsContainer');
    const imagesContainer = document.getElementById('additionalImagesContainer');
    if (!typeName) {
        container.innerHTML = '<div class="alert alert-danger mt-5">Room type not specified.</div>';
        return;
    }
    try {
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php');
        const roomTypes = Array.isArray(data) ? data : [];
        const type = roomTypes.find(t => (t.type_name || '').toLowerCase() === typeName.toLowerCase());
        if (!type) {
            container.innerHTML = '<div class="alert alert-warning mt-5">Room type not found.</div>';
            return;
        }
        let img = '';
        if (type.image_url) {
            img = type.image_url.startsWith('http')
                ? type.image_url
                : `/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/${type.image_url.replace(/^.*[\\\/]/, '')}`;
        } else {
            img = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop';
        }
        let featuresHtml = '';
        if (Array.isArray(type.features) && type.features.length) {
            featuresHtml = type.features.map(f =>
                `<span class="feature-tag">${f.feature_name}</span>`
            ).join('');
        }
        let desc = type.description || '';

        // Main hero section (bigger, more immersive)
        container.innerHTML = `
                <section class="room-hero-section d-flex flex-column flex-lg-row align-items-stretch mb-5" style="min-height:480px;">
                    <div class="room-hero-image flex-shrink-0" style="background-image: url('${img}'); min-width:480px; min-height:380px; background-size:cover; background-position:center; border-radius:32px 0 0 32px;"></div>
                    <div class="room-hero-content d-flex flex-column flex-grow-1 p-5" style="background:rgba(26,26,26,0.97); border-radius:0 32px 32px 0;">
                        <h1 class="mb-3" style="color:#ff6b6b;font-weight:800;font-size:2.8rem;letter-spacing:1px;">${type.type_name}</h1>
                        <div class="badge-container mb-3" style="font-size:1.1rem;">
                            <span class="custom-badge badge-info">${type.room_size_sqm ? type.room_size_sqm + ' sqm' : 'Spacious'}</span>
                            <span class="custom-badge badge-dark">${type.max_capacity || '2'} guests</span>
                        </div>
                        <p class="room-description mb-4" style="font-size:1.2rem;">${desc}</p>
                        <div class="features-container mb-4" style="font-size:1.05rem;">
                            ${featuresHtml}
                        </div>
                        <div class="room-footer mt-auto d-flex align-items-center justify-content-between" style="margin-top:2rem;">
                            <span class="price" style="font-size:2rem;">₱${type.price_per_stay ? Number(type.price_per_stay).toLocaleString() : '0'}/night</span>
                            <a href="./booking-form.html?type=${encodeURIComponent(type.type_name)}" class="book-btn" style="font-size:1.3rem;padding:0.8rem 2.2rem;">
                                <i class="fas fa-calendar-check"></i>
                                Book Now
                            </a>
                        </div>
                    </div>
                </section>
                `;

        // Additional images for this room type (from all rooms of this type)
        try {
            const res = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php', {
                params: { type: type.type_name }
            });
            const rooms = Array.isArray(res.data) ? res.data : [];
            let allImages = [];
            for (const room of rooms) {
                // Fetch images for each room
                try {
                    const imgRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/room-images.php', {
                        params: { room_id: room.room_id }
                    });
                    const imgs = Array.isArray(imgRes.data) ? imgRes.data : [];
                    allImages = allImages.concat(imgs.map(i => ({
                        url: `/Hotel-Reservation-Billing-System/assets/images/uploads/room-images/${i.image_url}`,
                        roomNum: room.room_number
                    })));
                } catch { }
            }
            // Deduplicate images by URL
            const images = [];
            const seenUrls = new Set();
            for (const img of allImages) {
                if (!seenUrls.has(img.url)) {
                    images.push(img);
                    seenUrls.add(img.url);
                }
            }
            if (images.length) {
                imagesContainer.innerHTML = `
                    <div class="gallery-section mb-5">
                        <h3 class="mb-4" style="color:#ff6b6b;font-weight:700;letter-spacing:1px;">Gallery</h3>
                        <div class="row g-4 gallery-images-bootstrap">
                            ${images.map(img => `
                                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                                    <div class="gallery-image-box h-100 p-2 bg-dark bg-opacity-75 rounded-4 shadow-sm position-relative overflow-hidden" style="transition:box-shadow .2s;">
                                        <img src="${img.url}" alt="Room Image" class="img-fluid rounded-3 shadow gallery-img-hover" style="width:100%;height:100%;object-fit:cover;transition:transform .30s;">
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                // Add hover effect for images (scale up)
                const style = document.createElement('style');
                style.innerHTML = `
                    .gallery-img-hover:hover {
                        transform: scale(1.07);
                        box-shadow: 0 8px 32px rgba(255,107,107,0.18);
                        z-index:2;
                    }
                    .gallery-image-box {
                        transition: box-shadow .2s;
                    }
                    .gallery-image-box:hover {
                        box-shadow: 0 8px 32px rgba(255,107,107,0.25), 0 1.5px 8px rgba(0,0,0,0.12);
                    }
                `;
                document.head.appendChild(style);
            } else {
                imagesContainer.innerHTML = '';
            }
        } catch {
            imagesContainer.innerHTML = '';
        }
    } catch (e) {
        container.innerHTML = '<div class="alert alert-danger mt-5">Failed to load room type details.</div>';
        imagesContainer.innerHTML = '';
    }
});