/**
 * Room Data Module - ES6 Module with API Integration
 */

class RoomDataManager {
    constructor() {
        this.apiBaseURL = window.location.origin + '/Hotel-Reservation-Billing-System/api';
        this.roomsData = {};
        this.masterData = {};
        this.isLoaded = false;
    }

    async initialize() {
        try {
            await this.loadFromAPI();
            this.setupFallbackData();
            this.isLoaded = true;
            console.log('Room data loaded successfully');
        } catch (error) {
            console.warn('API load failed, using fallback data:', error);
            this.setupFallbackData();
            this.isLoaded = true;
        }
    }

    async loadFromAPI() {
        const response = await fetch(`${this.apiBaseURL}/master-data/room-types.php`);
        const result = await response.json();

        if (result.success) {
            this.roomsData = result.data;
        } else {
            throw new Error(result.message);
        }
    }

    setupFallbackData() {
        // Fallback data matching database structure
        this.roomsData = {
            'REGULAR': {
                id: 'REGULAR',
                title: 'Regular Room',
                type: 'regular',
                price: 999,
                capacity: 2,
                size: '20m²',
                description: 'Comfortable standard room with essential amenities',
                period: '24 hours',
                checkIn: 'From 12:00 PM',
                checkOut: 'Until 12:00 PM',
                image: '../../assets/images/regular/regular-1.jpg',
                features: [
                    { icon: 'fas fa-bed', text: 'Double bed' },
                    { icon: 'fas fa-tv', text: '28" LED TV' },
                    { icon: 'fas fa-wifi', text: 'Free WiFi' },
                    { icon: 'fas fa-shower', text: 'Private bathroom' },
                    { icon: 'fas fa-snowflake', text: 'Air conditioning' },
                    { icon: 'fas fa-parking', text: 'Free parking' }
                ]
            },
            'DELUXE': {
                id: 'DELUXE',
                title: 'Deluxe Room',
                type: 'deluxe',
                price: 1999,
                capacity: 3,
                size: '24m²',
                description: 'Spacious room with upgraded amenities and comfort',
                period: '24 hours',
                checkIn: 'From 12:00 PM',
                checkOut: 'Until 12:00 PM',
                image: '../../../assets/images/deluxe/deluxe-1.jpg',
                features: [
                    { icon: 'fas fa-bed', text: 'Queen-size bed' },
                    { icon: 'fas fa-tv', text: '32" LED TV' },
                    { icon: 'fas fa-wifi', text: 'High-speed WiFi' },
                    { icon: 'fas fa-shower', text: 'Hot & cold shower' },
                    { icon: 'fas fa-snowflake', text: 'Air conditioning' },
                    { icon: 'fas fa-coffee', text: 'Coffee facilities' }
                ]
            },
            'EXECUTIVE': {
                id: 'EXECUTIVE',
                title: 'Executive Suite',
                type: 'executive',
                price: 2999,
                capacity: 4,
                size: '35m²',
                description: 'Luxury suite with premium amenities and services',
                period: '24 hours',
                checkIn: 'From 12:00 PM',
                checkOut: 'Until 12:00 PM',
                image: '../assets/images/executive/executive-1.jpg',
                features: [
                    { icon: 'fas fa-bed', text: 'King-size bed' },
                    { icon: 'fas fa-tv', text: '43" Smart TV' },
                    { icon: 'fas fa-wifi', text: 'Premium WiFi' },
                    { icon: 'fas fa-bath', text: 'Luxury bathroom' },
                    { icon: 'fas fa-snowflake', text: 'Climate control' },
                    { icon: 'fas fa-concierge-bell', text: 'Room service' }
                ]
            }
        };
    }

    // Convert legacy type codes to database codes
    normalizeRoomType(type) {
        const typeMap = {
            'regular': 'REGULAR',
            'deluxe': 'DELUXE',
            'executive': 'EXECUTIVE',
            'suite': 'EXECUTIVE' // Legacy compatibility
        };

        const upperType = type.toUpperCase();
        return typeMap[type.toLowerCase()] || upperType;
    }

    getRoomData(roomType) {
        const normalizedType = this.normalizeRoomType(roomType);
        return this.roomsData[normalizedType] || null;
    }

    getAllRooms() {
        return this.roomsData;
    }

    getFormattedPrice(roomType) {
        const room = this.getRoomData(roomType);
        return room ? `₱${room.price.toLocaleString()}` : '₱0';
    }

    getDownPayment(roomType) {
        const room = this.getRoomData(roomType);
        return room ? room.price * 0.5 : 0;
    }

    isValidRoomType(roomType) {
        const normalizedType = this.normalizeRoomType(roomType);
        return this.roomsData.hasOwnProperty(normalizedType);
    }

    // Get room by legacy type for backwards compatibility
    getRoomByType(type) {
        return this.getRoomData(type);
    }
}

// Create singleton instance
const roomDataManager = new RoomDataManager();

// ES6 Module export
export const RoomData = {
    async initialize() {
        await roomDataManager.initialize();
    },

    getRoomData: (roomType) => roomDataManager.getRoomData(roomType),
    getAllRooms: () => roomDataManager.getAllRooms(),
    getFormattedPrice: (roomType) => roomDataManager.getFormattedPrice(roomType),
    getDownPayment: (roomType) => roomDataManager.getDownPayment(roomType),
    isValidRoomType: (roomType) => roomDataManager.isValidRoomType(roomType),
    getRoomByType: (type) => roomDataManager.getRoomByType(type), // Legacy compatibility

    // Legacy structure for backwards compatibility
    rooms: new Proxy({}, {
        get(target, prop) {
            return roomDataManager.getRoomData(prop);
        }
    })
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await RoomData.initialize();
});

// Also attach to window for backwards compatibility
window.RoomData = RoomData;

console.log('RoomData module loaded (ES6 with API integration)');
