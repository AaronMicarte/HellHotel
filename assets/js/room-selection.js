/**
 * Room Selection System - Complete Logic
 */

class RoomSelectionManager {
    constructor() {
        this.selectedRooms = {};
        this.totalAmount = 0;
        this.totalDownPayment = 0;
        this.maxRoomsPerType = 5;

        this.initializeComponents();
    }

    initializeComponents() {
        this.setupDateRestrictions();
        this.loadRoomTypes();
        this.setupEventListeners();
        this.loadComponentsAndSetupNavigation();
    }

    loadComponentsAndSetupNavigation() {
        // Load header and footer
        if (window.Components) {
            window.Components.loadHeader('header-container', '../');
            window.Components.loadFooter('footer-container', '../');
        }
    }

    setupDateRestrictions() {
        const checkinDate = document.querySelector('input[name="checkin_date"]');
        const checkinTime = document.querySelector('input[name="checkin_time"]');

        if (checkinDate) {
            const today = new Date().toISOString().split('T')[0];
            checkinDate.min = today;
            checkinDate.value = today;
        }

        if (checkinTime) {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);
            checkinTime.value = currentTime;
        }
    }

    loadRoomTypes() {
        const container = document.getElementById('roomTypesContainer');
        if (!container || !window.RoomData) return;

        const roomTypes = window.RoomData.getAllRooms();
        container.innerHTML = '';

        Object.entries(roomTypes).forEach(([type, data]) => {
            const roomCard = this.createRoomTypeCard(type, data);
            container.appendChild(roomCard);
        });
    }

    createRoomTypeCard(type, data) {
        const cardElement = document.createElement('div');
        cardElement.className = 'col-lg-4 col-md-6 mb-4';

        cardElement.innerHTML = `
            <div class="room-type-card" data-room-type="${type}">
                <div class="room-status-indicator available">Available</div>
                <div class="room-image-container">
                    <img src="${data.image}" alt="${data.title}" onerror="this.src='../assets/images/placeholder-room.jpg'">
                    <div class="room-price-badge">${window.RoomData.getFormattedPrice(type)}/24hrs</div>
                </div>
                <div class="card-header">
                    <h5 class="card-title mb-1">${data.title}</h5>
                    <small class="text-muted">${data.size} • Max ${data.capacity} guests</small>
                </div>
                <div class="card-body">
                    <p class="card-text text-muted small">${data.description}</p>
                    

                    <div class="room-quantity-controls">
                        <button type="button" class="quantity-btn decrease" data-room-type="${type}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="quantity-display" data-room-type="${type}">0</div>
                        <button type="button" class="quantity-btn increase" data-room-type="${type}">
                            <i class="fas fa-plus"></i>
                        </button>
                        <span class="ms-2 text-muted">rooms</span>
                    </div>
                </div>
            </div>
        `;

        return cardElement;
    }

    setupEventListeners() {
        // Quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quantity-btn')) {
                const btn = e.target.closest('.quantity-btn');
                const roomType = btn.dataset.roomType;
                const isIncrease = btn.classList.contains('increase');

                this.updateRoomQuantity(roomType, isIncrease);
            }
        });

        // Form submission
        const form = document.getElementById('roomSelectionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.proceedToBooking();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetSelectionBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSelection();
            });
        }

        // Date/time changes
        const checkinDate = document.querySelector('input[name="checkin_date"]');
        const checkinTime = document.querySelector('input[name="checkin_time"]');

        if (checkinDate) {
            checkinDate.addEventListener('change', () => {
                this.updateSummary();
            });
        }

        if (checkinTime) {
            checkinTime.addEventListener('change', () => {
                this.updateSummary();
            });
        }
    }

    updateRoomQuantity(roomType, increase) {
        const currentQuantity = this.selectedRooms[roomType] || 0;
        let newQuantity = increase ? currentQuantity + 1 : currentQuantity - 1;

        // Validate quantity limits
        newQuantity = Math.max(0, Math.min(this.maxRoomsPerType, newQuantity));

        // Update internal state
        if (newQuantity === 0) {
            delete this.selectedRooms[roomType];
        } else {
            this.selectedRooms[roomType] = newQuantity;
        }

        // Update UI
        this.updateQuantityDisplay(roomType, newQuantity);
        this.updateRoomCardSelection(roomType, newQuantity > 0);
        this.updateSummary();
        this.updateButtonStates();

        // Show feedback
        if (increase && newQuantity > 0) {
            this.showQuantityFeedback(roomType, 'added');
        } else if (!increase && newQuantity >= 0) {
            this.showQuantityFeedback(roomType, 'removed');
        }
    }

    updateQuantityDisplay(roomType, quantity) {
        const display = document.querySelector(`.quantity-display[data-room-type="${roomType}"]`);
        if (display) {
            display.textContent = quantity;
            display.classList.add('animate-bounce');
            setTimeout(() => {
                display.classList.remove('animate-bounce');
            }, 500);
        }

        // Update buttons
        const decreaseBtn = document.querySelector(`.quantity-btn.decrease[data-room-type="${roomType}"]`);
        const increaseBtn = document.querySelector(`.quantity-btn.increase[data-room-type="${roomType}"]`);

        if (decreaseBtn) {
            decreaseBtn.disabled = quantity === 0;
        }

        if (increaseBtn) {
            increaseBtn.disabled = quantity >= this.maxRoomsPerType;
        }
    }

    updateRoomCardSelection(roomType, selected) {
        const card = document.querySelector(`.room-type-card[data-room-type="${roomType}"]`);
        if (card) {
            card.classList.toggle('selected', selected);

            // Add/remove selection counter
            let counter = card.querySelector('.selection-counter');
            if (selected && this.selectedRooms[roomType] > 0) {
                if (!counter) {
                    counter = document.createElement('div');
                    counter.className = 'selection-counter';
                    card.appendChild(counter);
                }
                counter.textContent = this.selectedRooms[roomType];
            } else if (counter) {
                counter.remove();
            }
        }
    }

    updateSummary() {
        const hasSelection = Object.keys(this.selectedRooms).length > 0;
        const summaryContainer = document.getElementById('bookingSummary');

        if (!hasSelection) {
            summaryContainer.classList.add('d-none');
            return;
        }

        summaryContainer.classList.remove('d-none');

        // Calculate totals
        this.calculateTotals();

        // Update summary details
        this.updateSummaryDetails();

        // Update checkout time
        this.updateCheckoutTime();
    }

    calculateTotals() {
        this.totalAmount = 0;

        Object.entries(this.selectedRooms).forEach(([roomType, quantity]) => {
            const roomData = window.RoomData.getRoomData(roomType);
            if (roomData) {
                this.totalAmount += roomData.price * quantity;
            }
        });

        this.totalDownPayment = this.totalAmount * 0.5;
    }

    updateSummaryDetails() {
        const detailsContainer = document.getElementById('summaryDetails');
        if (!detailsContainer) return;

        let detailsHTML = '';

        Object.entries(this.selectedRooms).forEach(([roomType, quantity]) => {
            const roomData = window.RoomData.getRoomData(roomType);
            if (roomData) {
                const subtotal = roomData.price * quantity;
                detailsHTML += `
                    <div class="summary-item d-flex justify-content-between">
                        <span>${quantity}x ${roomData.title}</span>
                        <span class="fw-bold">₱${subtotal.toLocaleString()}</span>
                    </div>
                `;
            }
        });

        detailsContainer.innerHTML = detailsHTML;

        // Update totals
        const totalRateEl = document.getElementById('totalRate');
        const totalDownPaymentEl = document.getElementById('totalDownPayment');

        if (totalRateEl) {
            totalRateEl.textContent = `₱${this.totalAmount.toLocaleString()}`;
        }

        if (totalDownPaymentEl) {
            totalDownPaymentEl.textContent = `₱${this.totalDownPayment.toLocaleString()}`;
        }
    }

    updateCheckoutTime() {
        const checkinDate = document.querySelector('input[name="checkin_date"]').value;
        const checkinTime = document.querySelector('input[name="checkin_time"]').value;

        if (checkinDate && checkinTime) {
            const checkinDateTime = new Date(`${checkinDate}T${checkinTime}`);
            const checkoutDateTime = new Date(checkinDateTime.getTime() + (24 * 60 * 60 * 1000));

            const checkoutDate = checkoutDateTime.toLocaleDateString();
            const checkoutTime = checkoutDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const checkoutEl = document.getElementById('checkoutDateTime');
            if (checkoutEl) {
                checkoutEl.textContent = `${checkoutDate} at ${checkoutTime}`;
            }
        }
    }

    updateButtonStates() {
        const proceedBtn = document.getElementById('proceedToBookingBtn');
        const hasSelection = Object.keys(this.selectedRooms).length > 0;

        if (proceedBtn) {
            proceedBtn.disabled = !hasSelection;
        }
    }

    showQuantityFeedback(roomType, action) {
        const roomData = window.RoomData.getRoomData(roomType);
        if (roomData && window.HotelUtils) {
            const message = action === 'added'
                ? `${roomData.title} added to selection`
                : `${roomData.title} removed from selection`;

            window.HotelUtils.showToast('Selection Updated', message, 'success');
        }
    }

    resetSelection() {
        this.selectedRooms = {};
        this.totalAmount = 0;
        this.totalDownPayment = 0;

        // Reset all quantity displays
        document.querySelectorAll('.quantity-display').forEach(display => {
            display.textContent = '0';
        });

        // Reset all room cards
        document.querySelectorAll('.room-type-card').forEach(card => {
            card.classList.remove('selected');
            const counter = card.querySelector('.selection-counter');
            if (counter) {
                counter.remove();
            }
        });

        // Reset all buttons
        document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
            btn.disabled = true;
        });

        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            btn.disabled = false;
        });

        // Hide summary
        document.getElementById('bookingSummary').classList.add('d-none');

        // Disable proceed button
        document.getElementById('proceedToBookingBtn').disabled = true;

        if (window.HotelUtils) {
            window.HotelUtils.showToast('Selection Reset', 'All room selections have been cleared', 'info');
        }
    }

    proceedToBooking() {
        const checkinDate = document.querySelector('input[name="checkin_date"]').value;
        const checkinTime = document.querySelector('input[name="checkin_time"]').value;

        if (!checkinDate || !checkinTime) {
            if (window.HotelUtils) {
                window.HotelUtils.showToast('Missing Information', 'Please select check-in date and time', 'warning');
            }
            return;
        }

        if (Object.keys(this.selectedRooms).length === 0) {
            if (window.HotelUtils) {
                window.HotelUtils.showToast('No Rooms Selected', 'Please select at least one room', 'warning');
            }
            return;
        }

        // Prepare booking data
        const bookingData = {
            checkinDate,
            checkinTime,
            selectedRooms: this.selectedRooms,
            totalAmount: this.totalAmount,
            totalDownPayment: this.totalDownPayment
        };

        // Store in sessionStorage for next page
        sessionStorage.setItem('hotelBookingData', JSON.stringify(bookingData));

        // Show loading and redirect
        if (window.HotelUtils) {
            window.HotelUtils.showToast('Proceeding', 'Redirecting to booking form...', 'info');
        }

        setTimeout(() => {
            window.location.href = 'booking-form.html';
        }, 1000);
    }

    // Public methods for external access
    getSelectedRooms() {
        return this.selectedRooms;
    }

    getTotalAmount() {
        return this.totalAmount;
    }

    getTotalDownPayment() {
        return this.totalDownPayment;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    window.roomSelectionManager = new RoomSelectionManager();
});

// Export for global access
window.RoomSelectionManager = RoomSelectionManager;
