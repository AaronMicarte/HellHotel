/**
 * Room Navigation and Display Module
 * Clean and maintainable room handling
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Room navigation ready');
    initializeRoomModule();
});

/**
 * Initialize room module
 */
function initializeRoomModule() {
    // Setup room navigation for home page
    setupRoomNavigation();

    // Initialize room page if we're on a room page
    const roomApp = document.getElementById('roomApp');
    if (roomApp) {
        const roomType = roomApp.dataset.roomType;
        if (roomType && window.RoomData && window.RoomData.isValidRoomType(roomType)) {
            // Room page initialization is now handled by room-page.js module
            console.log('Room page detected, delegating to RoomPage module');
        }
    }
}

/**
 * Setup room navigation for buttons
 */
function setupRoomNavigation() {
    // Add event listeners for room cards on home page
    const roomButtons = document.querySelectorAll('[data-room-type]');
    roomButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const roomType = this.dataset.roomType;
            if (roomType) {
                navigateToRoom(roomType);
            }
        });
    });
}

/**
 * Navigate to specific room template
 * @param {string} roomType - Type of room
 */
function navigateToRoom(roomType) {
    const validRoomTypes = ['regular', 'deluxe', 'executive'];

    if (validRoomTypes.includes(roomType)) {
        // Show loading toast before navigation
        if (window.HotelUtils) {
            window.HotelUtils.showToast('Loading Room', `Redirecting to ${roomType} room...`, 'info');
        }

        setTimeout(() => {
            window.location.href = `rooms/room-template.html?type=${roomType}`;
        }, 500);
    } else {
        console.error('Invalid room type:', roomType);
        if (window.HotelUtils) {
            window.HotelUtils.showToast('Error', 'Room type not found', 'error');
        }
    }
}

/**
 * Legacy function for backward compatibility
 */
function viewRoom(roomType) {
    navigateToRoom(roomType);
}

// Enhanced room booking functionality with backend integration

document.addEventListener('DOMContentLoaded', function () {
    // Initialize booking form handlers
    initializeBookingForm();

    // Initialize real-time room status updates
    initializeRoomStatusUpdates();
});

function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    // Handle form submission
    bookingForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(this);
        const bookingData = Object.fromEntries(formData.entries());

        // Validate required fields
        if (!validateBookingForm(bookingData)) {
            return;
        }

        try {
            // Show loading state
            Swal.fire({
                title: 'Processing Booking...',
                text: 'Please wait while we process your reservation',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            // Submit booking (placeholder - replace with actual API call)
            const response = await submitBooking(bookingData);

            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Booking Successful!',
                    text: 'Your reservation has been confirmed. You will receive a confirmation email shortly.',
                    confirmButtonColor: '#FF3366'
                }).then(() => {
                    // Redirect to confirmation page (HTML version)
                    window.location.href = 'pages/booking-confirmation.html?id=' + response.bookingId;
                });
            } else {
                throw new Error(response.message || 'Booking failed');
            }

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Booking Failed',
                text: error.message || 'There was an error processing your booking. Please try again.',
                confirmButtonColor: '#FF3366'
            });
        }
    });
}

function validateBookingForm(data) {
    const requiredFields = [
        'first_name', 'last_name', 'date_of_birth', 'email',
        'phone_number', 'id_type', 'id_number', 'checkin_date',
        'time_slot', 'guests', 'payment_method'
    ];

    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: `Please fill in all required fields. Missing: ${field.replace('_', ' ')}`,
                confirmButtonColor: '#FF3366'
            });
            return false;
        }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Email',
            text: 'Please enter a valid email address.',
            confirmButtonColor: '#FF3366'
        });
        return false;
    }

    // Validate date of birth (must be at least 18 years old)
    const dob = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();

    if (age < 18) {
        Swal.fire({
            icon: 'warning',
            title: 'Age Restriction',
            text: 'Guests must be at least 18 years old to make a reservation.',
            confirmButtonColor: '#FF3366'
        });
        return false;
    }

    // Validate check-in date (must be future date)
    const checkinDate = new Date(data.checkin_date);
    if (checkinDate <= today) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Date',
            text: 'Check-in date must be in the future.',
            confirmButtonColor: '#FF3366'
        });
        return false;
    }

    return true;
}

async function submitBooking(bookingData) {
    // Placeholder for actual API call
    // Replace with actual endpoint when backend is ready
    try {
        const response = await fetch('../api/submit-booking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        return await response.json();
    } catch (error) {
        // Temporary mock response for frontend testing
        console.log('Booking data to be submitted:', bookingData);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock successful response
        return {
            success: true,
            bookingId: 'BOOK' + Date.now(),
            message: 'Booking confirmed successfully'
        };
    }
}

function initializeRoomStatusUpdates() {
    // Function to update room status indicators
    async function updateRoomStatuses() {
        try {
            const response = await fetch('../api/get-room-status.html');
            const data = await response.json();

            if (data.success) {
                Object.entries(data.data).forEach(([roomType, status]) => {
                    updateRoomStatusUI(roomType, status);
                });
            }
        } catch (error) {
            // For HTML version, use mock data
            const data = {
                success: true,
                data: {
                    'regular': 'available',
                    'deluxe': 'available',
                    'executive': 'available'
                }
            };

            if (data.success) {
                Object.entries(data.data).forEach(([roomType, status]) => {
                    updateRoomStatusUI(roomType, status);
                });
            }
        }
    }

    // Update room status in UI
    function updateRoomStatusUI(roomType, status) {
        const roomCard = document.querySelector(`[data-room-type="${roomType}"]`);
        if (!roomCard) return;

        const statusBadge = roomCard.querySelector('.room-status-badge');
        const statusInfo = roomCard.querySelector('.room-status-info small');
        const bookButton = roomCard.querySelector('.book-room-btn');

        if (!statusBadge || !statusInfo || !bookButton) return;

        // Remove existing status classes
        statusBadge.classList.remove('available', 'occupied', 'maintenance');

        // Update based on new status
        switch (status) {
            case 'available':
                statusBadge.classList.add('available');
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Available';
                statusInfo.className = 'text-success';
                statusInfo.innerHTML = '<i class="fas fa-check-circle"></i> Ready for booking';
                bookButton.disabled = false;
                bookButton.textContent = 'View Details & Book';
                break;
            case 'occupied':
                statusBadge.classList.add('occupied');
                statusBadge.innerHTML = '<i class="fas fa-user-check"></i> Occupied';
                statusInfo.className = 'text-warning';
                statusInfo.innerHTML = '<i class="fas fa-clock"></i> Currently occupied';
                bookButton.disabled = true;
                bookButton.textContent = 'Currently Unavailable';
                break;
            case 'maintenance':
                statusBadge.classList.add('maintenance');
                statusBadge.innerHTML = '<i class="fas fa-tools"></i> Maintenance';
                statusInfo.className = 'text-danger';
                statusInfo.innerHTML = '<i class="fas fa-tools"></i> Under maintenance';
                bookButton.disabled = true;
                bookButton.textContent = 'Under Maintenance';
                break;
        }
    }

    // Initial load
    updateRoomStatuses();

    // Update every 30 seconds for real-time status
    setInterval(updateRoomStatuses, 30000);
}

// Export functions for global access
window.viewRoom = viewRoom;
window.viewRoomDetails = navigateToRoom;

// Export module
window.RoomsModule = {
    navigateToRoom,
    viewRoom,
    viewRoomDetails: navigateToRoom
};

// Export functions for use in other scripts
window.HotelBooking = {
    validateBookingForm,
    submitBooking,
    initializeBookingForm,
    initializeRoomStatusUpdates
};
