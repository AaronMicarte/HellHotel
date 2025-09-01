/**
 * Room Page Manager - ES6 Module with Fixed Loading
 */

import { RoomData } from './room-data.js';

export const RoomPageManager = {
    initialize: function (roomType) {
        console.log('RoomPageManager: Starting initialization for', roomType);

        // Get the room data
        const roomData = RoomData.getRoomData(roomType);

        if (!roomData) {
            console.error('Room not found:', roomType);
            this.showError('Room type not found: ' + roomType);
            return;
        }

        console.log('Found room data:', roomData);

        // Populate the page immediately
        this.populateRoomDetails(roomData);

        // Hide loading and show content
        this.hideLoading();
        this.showContent();

        // Show success feedback
        if (window.HotelUtils && window.HotelUtils.showToast) {
            window.HotelUtils.showToast('Room Loaded', `${roomData.title} details loaded successfully!`, 'success');
        }

        console.log('Room page initialization completed');
    },

    populateRoomDetails: function (roomData) {
        console.log('Populating room details:', roomData.title);

        // Basic room information
        const elements = {
            roomTitle: roomData.title,
            roomPrice: RoomData.getFormattedPrice(roomData.type),
            roomPeriod: roomData.period,
            roomDescription: roomData.description,
            roomCapacity: `${roomData.capacity} guests`,
            roomSize: roomData.size,
            roomCheckIn: roomData.checkIn,
            roomCheckOut: roomData.checkOut
        };

        // Update all elements
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${id}:`, value);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });

        // Room image with error handling
        const roomImage = document.getElementById('roomImage');
        if (roomImage) {
            roomImage.src = roomData.image;
            roomImage.alt = roomData.title;
            roomImage.onerror = function () {
                console.warn('Image failed to load, using fallback');
                this.src = 'assets/images/placeholder-room.jpg';
            };
        }

        // Booking sidebar pricing
        const displayRoomPrice = document.getElementById('displayRoomPrice');
        const displayDownPayment = document.getElementById('displayDownPayment');
        const bookingRoomTitle = document.getElementById('bookingRoomTitle');

        if (displayRoomPrice) {
            displayRoomPrice.textContent = RoomData.getFormattedPrice(roomData.type);
        }

        if (displayDownPayment) {
            displayDownPayment.textContent = `₱${RoomData.getDownPayment(roomData.type).toLocaleString()}`;
        }

        if (bookingRoomTitle) {
            bookingRoomTitle.textContent = roomData.title;
        }

        // Room features
        this.populateRoomFeatures(roomData.features);

        // Update page title and breadcrumb
        document.title = `${roomData.title} - HellHotel`;
        const breadcrumb = document.getElementById('breadcrumbRoom');
        if (breadcrumb) {
            breadcrumb.textContent = roomData.title;
        }

        console.log('Room details population completed');
    },

    populateRoomFeatures: function (features) {
        const featuresContainer = document.getElementById('roomFeatures');
        if (!featuresContainer) {
            console.warn('Features container not found');
            return;
        }

        featuresContainer.innerHTML = '';

        features.forEach(feature => {
            const featureHTML = `
                <div class="col-6 col-md-4 mb-3">
                    <div class="feature-item d-flex align-items-center">
                        <i class="${feature.icon} text-primary me-2"></i>
                        <span class="small">${feature.text}</span>
                    </div>
                </div>
            `;
            featuresContainer.insertAdjacentHTML('beforeend', featureHTML);
        });

        console.log(`Populated ${features.length} features`);
    },

    hideLoading: function () {
        const loadingEl = document.getElementById('roomLoading');
        if (loadingEl) {
            loadingEl.classList.add('d-none');
            console.log('Loading hidden');
        }
    },

    showContent: function () {
        const contentEl = document.getElementById('roomContent');
        if (contentEl) {
            contentEl.classList.remove('d-none');
            console.log('Content shown');
        }
    },

    showError: function (message) {
        const loadingEl = document.getElementById('roomLoading');
        const contentEl = document.getElementById('roomContent');
        const errorEl = document.getElementById('roomError');

        if (loadingEl) loadingEl.classList.add('d-none');
        if (contentEl) contentEl.classList.add('d-none');
        if (errorEl) errorEl.classList.remove('d-none');

        console.error('Room error:', message);

        if (window.HotelUtils && window.HotelUtils.showToast) {
            window.HotelUtils.showToast('Error', message, 'error');
        }
    }
};

// Also attach to window for backwards compatibility
window.RoomPageManager = RoomPageManager;

console.log('RoomPageManager module loaded (ES6)');
