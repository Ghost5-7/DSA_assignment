class Customer {
    constructor(fullName, email, phone, licenseNumber) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.licenseNumber = licenseNumber;
    }
}

class Booking {
    constructor(customer, startDate, endDate) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.customer = customer;
        this.startDate = startDate;
        this.endDate = endDate;
        this.timestamp = new Date();
        this.status = 'pending'; // pending, active, completed, cancelled
    }
}

class Car {
    constructor(id, name, category, price, available = true, specs = {}) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price; // Price in INR per day
        this.available = available;
        this.waitingList = [];
        this.currentBooking = null;
        this.maxWaitingList = 10;
        this.specs = specs; // Additional specifications
    }

    addToWaitingList(booking) {
        // If car is available, assign it immediately
        if (this.available) {
            this.currentBooking = booking;
            booking.status = 'active';
            this.available = false;
            return { position: 0, status: 'immediate' };
        }

        // Otherwise, add to waiting list
        if (this.waitingList.length >= this.maxWaitingList) {
            throw new Error(`Waiting list for ${this.name} is full. Please try another car.`);
        }

        booking.status = 'waiting';
        this.waitingList.push(booking);
        this.waitingList.sort((a, b) => a.timestamp - b.timestamp);
        
        return { position: this.waitingList.length, status: 'waiting' };
    }
    // well booking cannot happen backwards, also it should be for minimum of one day.
    datesOverlap(start1, end1, start2, end2) {
        return start1 <= end2 && end1 >= start2;
    }
    // to get booking status
    getBookingStatus(bookingId) {
        const position = this.getWaitingPosition(bookingId);
        const booking = this.waitingList.find(b => b.id === bookingId);
        
        if (!booking) return null;

        return {
            position,
            estimatedStartDate: booking.startDate,
            estimatedEndDate: booking.endDate,
            status: position === 1 ? 'Next in line' : `Position ${position} in queue`
        };
    }
    // to remove booking from waiting list
    removeFromWaitingList(bookingId) {
        const index = this.waitingList.findIndex(booking => booking.id === bookingId);
        if (index !== -1) {
            this.waitingList.splice(index, 1);
            this.updateAvailability();
            return true;
        }
        return false;
    }
    // to update availability
    updateAvailability() {
        this.available = !this.currentBooking && this.waitingList.length === 0;
    }
    // to get waiting position
    getWaitingPosition(bookingId) {
        return this.waitingList.findIndex(booking => booking.id === bookingId) + 1;
    }
    // to complete current booking
    completeCurrentBooking() {
        if (!this.currentBooking) {
            throw new Error("No active booking to complete");
        }
        
        const completedBooking = this.currentBooking;
        completedBooking.status = 'completed';
        this.currentBooking = null;
        
        // Check waiting list and assign to next customer if available
        if (this.waitingList.length > 0) {
            const nextBooking = this.waitingList[0];
            // Check if next booking starts today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const bookingStart = new Date(nextBooking.startDate);
            bookingStart.setHours(0, 0, 0, 0);

            if (bookingStart.getTime() === today.getTime()) {
                // If booking starts today, activate it
                this.currentBooking = this.waitingList.shift();
                this.currentBooking.status = 'active';
                this.available = false;
                return {
                    completedBooking,
                    message: `Next booking activated for ${this.currentBooking.customer.fullName}`
                };
            }
        }
        
        // No immediate next booking
        this.available = true;
        return {
            completedBooking,
            message: "Booking completed. No immediate bookings scheduled."
        };
    }
    // to remove booking
    removeBooking(bookingId) {
        let removedBooking = null;
        let message = "";

        // Check if it's the current booking
        if (this.currentBooking && this.currentBooking.id === bookingId) {
            removedBooking = this.currentBooking;
            this.currentBooking = null;

            // Check waiting list for next eligible booking
            if (this.waitingList.length > 0) {
                const nextBooking = this.waitingList[0];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const bookingStart = new Date(nextBooking.startDate);
                bookingStart.setHours(0, 0, 0, 0);

                if (bookingStart.getTime() === today.getTime()) {
                    this.currentBooking = this.waitingList.shift();
                    this.currentBooking.status = 'active';
                    this.available = false;
                    message = `Booking removed and next booking activated for ${this.currentBooking.customer.fullName}`;
                } else {
                    this.available = true;
                    message = "Booking removed. No immediate bookings scheduled.";
                }
            } else {
                this.available = true;
                message = "Booking removed. No bookings in queue.";
            }
        } else {
            // Check waiting list
            const index = this.waitingList.findIndex(booking => booking.id === bookingId);
            if (index !== -1) {
                removedBooking = this.waitingList[index];
                this.waitingList.splice(index, 1);
                message = "Booking removed from waiting list.";
            }
        }

        return { removedBooking, message };
    }

/*    // to check if dates are available
    isAvailableForDates(startDate, endDate) {
        // Convert dates to timestamps for comparison
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        // Check current booking
        if (this.currentBooking) {
            if (this.datesOverlap(
                start, end,
                this.currentBooking.startDate.getTime(),
                this.currentBooking.endDate.getTime()
            )) {
                return false;
            }
        }

        // Check waiting list
        for (const booking of this.waitingList) {
            if (this.datesOverlap(
                start, end,
                booking.startDate.getTime(),
                booking.endDate.getTime()
            )) {
                return false;
            }
        }

        return true;
    }*/
}

class CarRental {
    constructor() {
        this.cars = [
            // SUVs
            new Car(1, "Toyota Fortuner", "suv", 5000000, true, {
                seats: 7,
                transmission: "Automatic",
                fuel: "Diesel"
            }),
            new Car(2, "Hyundai Creta", "suv", 3500000, true, {
                seats: 5,
                transmission: "Manual",
                fuel: "Petrol"
            }),
            new Car(3, "Mahindra XUV700", "suv", 4000000, true, {
                seats: 7,
                transmission: "Automatic",
                fuel: "Diesel"
            }),

            // Sedans
            new Car(4, "Honda City", "sedan", 2500000, true, {
                seats: 5,
                transmission: "Automatic",
                fuel: "Petrol"
            }),
            new Car(5, "Hyundai Verna", "sedan", 2800000, true, {
                seats: 5,
                transmission: "Manual",
                fuel: "Diesel"
            }),
            new Car(6, "Skoda Slavia", "sedan", 3000000, true, {
                seats: 5,
                transmission: "Automatic",
                fuel: "Petrol"
            }),

            // Luxury
            new Car(7, "BMW 7 Series", "luxury", 15000000, true, {
                seats: 5,
                transmission: "Automatic",
                fuel: "Petrol",
                features: ["Premium Sound", "Massage Seats"]
            }),
            new Car(8, "Mercedes S-Class", "luxury", 18000000, true, {
                seats: 5,
                transmission: "Automatic",
                fuel: "Petrol",
                features: ["Premium Sound", "Executive Rear Seats"]
            }),
            new Car(9, "Audi A8", "luxury", 16000000, true, {
                seats: 5,
                transmission: "Automatic",
                fuel: "Petrol",
                features: ["Premium Sound", "Air Suspension"]
            }),

            // Sports Cars
            new Car(10, "Lamborghini Huracán", "sports", 50000000, true, {
                topSpeed: "320 km/h",
                acceleration: "0-100 in 2.9s",
                transmission: "Automatic",
                fuel: "Petrol"
            }),
            new Car(11, "Bugatti Chiron", "sports", 100000000, true, {
                topSpeed: "420 km/h",
                acceleration: "0-100 in 2.4s",
                transmission: "Automatic",
                fuel: "Petrol"
            }),
            new Car(12, "Ferrari F8 Tributo", "sports", 45000000, true, {
                topSpeed: "340 km/h",
                acceleration: "0-100 in 2.9s",
                transmission: "Automatic",
                fuel: "Petrol"
            })
        ];
        this.customers = new Map();
        this.bookings = new Map();
    }

    createCustomer(fullName, email, phone, licenseNumber) {
        const customer = new Customer(fullName, email, phone, licenseNumber);
        this.customers.set(customer.id, customer);
        return customer;
    }

    createBooking(carId, customerData, startDate, endDate) {
        const car = this.cars.find(car => car.id === carId);
        if (!car) throw new Error("Car not found");

        // Validate booking duration
        const duration = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        if (duration < 1 || duration > 7) {
            throw new Error("Booking duration must be between 1 and 7 days");
        }

        const customer = this.createCustomer(
            customerData.fullName,
            customerData.email,
            customerData.phone,
            customerData.licenseNumber
        );

        const booking = new Booking(customer, new Date(startDate), new Date(endDate));
        this.bookings.set(booking.id, booking);
        car.addToWaitingList(booking);

        return { booking, position: car.getWaitingPosition(booking.id) };
    }

    getCarWaitingList(carId) {
        const car = this.cars.find(c => c.id === carId);
        if (!car) throw new Error("Car not found");
        
        return car.waitingList.map((booking, index) => ({
            position: index + 1,
            customer: booking.customer,
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: index === 0 ? 'Next in line' : `Position ${index + 1} in queue`
        }));
    }

    getCarsByCategory(category) {
        console.log("Searching for category:", category);
        let filteredCars = this.cars.filter(car => car.category === category);
        console.log("Found cars:", filteredCars);
        return filteredCars;
    }
}

// Initialize the car rental system with cars
let rentalSystem = new CarRental();
let selectedCarId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    // Close modal when clicking the close button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.classList.add('hidden');
            });
        });
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Prevent modal from closing when clicking inside modal content
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        content.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    });

    // Initialize the booking form submit handler
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);

    // Add category click handlers
    let categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            let category = card.dataset.category;
            console.log("Category clicked:", category);
            displayCars(category);
        });
    });
});

function displayCars(category) {
    let carGrid = document.getElementById('carGrid');
    let carList = document.getElementById('car-list');
    let cars = rentalSystem.getCarsByCategory(category);

    console.log("Displaying cars for category:", category);
    console.log("Cars found:", cars);

    // Clear previous content
    carGrid.innerHTML = '';
    
    if (!cars || cars.length === 0) {
        carGrid.innerHTML = '<p class="no-cars">No cars available in this category</p>';
        carList.classList.remove('hidden');
        return;
    }

    cars.forEach(car => {
        let waitingListCount = car.waitingList.length;
        let availabilityStatus = car.available ? 'Available Now' : 'In Use';
        let queueStatus = waitingListCount === car.maxWaitingList ? 'Full' : 
                         `${waitingListCount}/${car.maxWaitingList}`;

        let carCard = document.createElement('div');
        carCard.className = 'car-card';
        carCard.innerHTML = `
            <div class="car-details">
                <h3>${car.name}</h3>
                <div class="car-specs">
                    ${getSpecsHTML(car.specs)}
                </div>
                <p class="car-price">₹${car.price.toLocaleString('en-IN')}</p>
                <div class="car-status">
                    <div class="queue-indicator">
                        <span class="queue-dot ${car.available ? 'queue-available' : 'queue-busy'}"></span>
                        <span>${availabilityStatus}</span>
                    </div>
                    <span class="queue-count">Queue: ${queueStatus}</span>
                </div>
                <div class="button-group">
                    <button class="button primary" 
                            onclick="openBookingModal(${car.id})"
                            ${waitingListCount === car.maxWaitingList ? 'disabled' : ''}>
                        ${car.available ? 'Book Now' : waitingListCount === car.maxWaitingList ? 'Queue Full' : 'Join Queue'}
                    </button>
                    <button class="button secondary" onclick="viewWaitingList(${car.id})">
                        View Queue
                    </button>
                    ${car.currentBooking ? `
                        <button class="button complete-booking" onclick="completeBooking(${car.id})">
                            Complete Booking
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="booking-calendar">
                <h4>Upcoming Bookings</h4>
                ${getBookingCalendarHTML(car)}
            </div>
        `;
        carGrid.appendChild(carCard);
    });

    carList.classList.remove('hidden');
}

// Helper function for calendar display
function getBookingCalendarHTML(car) {
    let bookings = [];
    if (car.currentBooking) {
        bookings.push(car.currentBooking);
    }
    bookings = bookings.concat(car.waitingList);

    if (bookings.length === 0) {
        return '<p class="no-bookings">No upcoming bookings</p>';
    }

    return `
        <div class="calendar-list">
            ${bookings.map((booking, index) => `
                <div class="calendar-item ${booking.status === 'active' ? 'active-booking' : ''}">
                    <div class="booking-info">
                        <span class="booking-customer">${booking.customer.fullName}</span>
                        <span class="booking-date">
                            ${new Date(booking.startDate).toLocaleDateString()} - 
                            ${new Date(booking.endDate).toLocaleDateString()}
                        </span>
                        <span class="booking-status ${booking.status}">${booking.status}</span>
                    </div>
                    <div class="booking-actions">
                        ${booking.status === 'active' ? `
                            <button class="button complete-booking" 
                                    onclick="completeBooking(${car.id})">
                                Complete
                            </button>
                        ` : ''}
                        <button class="button remove-booking" 
                                onclick="removeBooking(${car.id}, '${booking.id}')">
                            Remove
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function openBookingModal(carId) {
    selectedCarId = carId;
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('hidden');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
}

function viewWaitingList(carId) {
    let car = rentalSystem.cars.find(car => car.id === carId);
    let modal = document.getElementById('waitingListModal');
    let content = document.getElementById('waitingListContent');

    if (!car) return;

    let waitingList = rentalSystem.getCarWaitingList(carId);
    
    content.innerHTML = `
        <h3>${car.name} - Waiting List</h3>
        <div class="waiting-list-summary">
            <p>Total in queue: ${waitingList.length}</p>
            <p>Maximum waiting list size: ${car.maxWaitingList}</p>
            <p>Daily Rate: ₹${car.price.toLocaleString('en-IN')}</p>
        </div>
        <div class="waiting-list-container">
            ${waitingList.map(entry => `
                <div class="waiting-list-item ${entry.position === 1 ? 'next-in-line' : ''}">
                    <div class="position-badge">${entry.position}</div>
                    <div class="booking-details">
                        <h4>${entry.customer.fullName}</h4>
                        <p class="booking-dates">
                            <span class="date-label">From:</span> ${entry.startDate.toLocaleDateString()}
                            <span class="date-label">To:</span> ${entry.endDate.toLocaleDateString()}
                        </p>
                        <p class="status-badge ${entry.position === 1 ? 'next' : 'waiting'}">
                            ${entry.status}
                        </p>
                    </div>
                </div>
            `).join('')}
        </div>
        ${waitingList.length === 0 ? '<p class="empty-list">No customers in waiting list</p>' : ''}
    `;

    modal.classList.remove('hidden');
}

function handleBookingSubmit(event) {
    event.preventDefault();

    const customerData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        licenseNumber: document.getElementById('licenseNumber').value
    };

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        const { booking, position } = rentalSystem.createBooking(
            selectedCarId,
            customerData,
            startDate,
            endDate
        );

        
        document.getElementById('bookingModal').classList.add('hidden');
        document.getElementById('bookingForm').reset();

        // Refresh the display
        const car = rentalSystem.cars.find(car => car.id === selectedCarId);
        displayCars(car.category);
    } catch (error) {
        alert(error.message);
    }
}



// Update the booking confirmation message
function showBookingConfirmation(booking, car) {
    const totalCost = calculateTotalCost(car, booking.startDate, booking.endDate);
    return `
        <div class="booking-confirmation">
            <h3>Booking Confirmation</h3>
            <p>Car: ${car.name}</p>
            <p>Duration: ${booking.startDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}</p>
            <p>Total Cost: ${totalCost}</p>
            <p>Status: ${booking.status === 'immediate' ? 'Car Available Now!' : 'Added to Waiting List'}</p>
        </div>
    `;
}

function getSpecsHTML(specs) {
    if (!specs) return '';
    
    return Object.entries(specs)
        .filter(([key, value]) => !Array.isArray(value)) // Handle non-array specs
        .map(([key, value]) => `
            <div class="spec-item">
                <span class="spec-label">${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                <span class="spec-value">${value}</span>
            </div>
        `).join('') +
        (specs.features ? `
            <div class="spec-item">
                <span class="spec-label">Features:</span>
                <span class="spec-value">${specs.features.join(', ')}</span>
            </div>
        ` : '');
}
// to complete booking 
function completeBooking(carId) {
    try {
        const car = rentalSystem.cars.find(car => car.id === carId);
        if (!car) throw new Error("Car not found");

        const result = car.completeCurrentBooking();
        if (result.completedBooking) {
            // Refresh the display
            displayCars(car.category);
            alert(result.message);
        }
    } catch (error) {
        alert(error.message);
    }
}
// to remove booking from waiting list
function removeBooking(carId, bookingId) {
    try {
        const car = rentalSystem.cars.find(car => car.id === carId);
        if (!car) throw new Error("Car not found");

        const result = car.removeBooking(bookingId);
        if (result.removedBooking) {
            // Refresh the display
            displayCars(car.category);
            alert(result.message);
        }
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById('bookingForm').addEventListener('submit', function(event) {
    // Prevent default form submission
    event.preventDefault();

    const formData = new FormData(this);

    fetch(this.action, {
        method: this.method,
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Handle success
            console.log('Form submitted successfully!');
            // Optionally, show a success message in the UI
            document.getElementById('successMessage').textContent = 'Booking successful!';
            document.getElementById('successMessage').classList.remove('hidden');
            this.reset(); // Reset the form
        } else {
            // Handle errors
            console.error('Form submission error:', response.statusText);
            document.getElementById('errorMessage').textContent = 'There was an error submitting the form.';
            document.getElementById('errorMessage').classList.remove('hidden');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('errorMessage').textContent = 'There was an error submitting the form.';
        document.getElementById('errorMessage').classList.remove('hidden');
    });
});
