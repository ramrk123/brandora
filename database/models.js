const mongoose = require('mongoose');

// --- schemas ---

const adminSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    created_at: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    benefits: { type: String, default: '' }, // pipe-separated
    icon: { type: String, default: 'palette' },
    price_display: { type: String, default: 'Contact for Quote' },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    district: { type: String, required: true },
    contact_number: { type: String, required: true },
    email: { type: String, required: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    service_name: { type: String, required: true },
    message: { type: String },
    status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    service_name: { type: String, required: true },
    image_url: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const contentSchema = new mongoose.Schema({
    section_key: { type: String, unique: true, required: true },
    title: { type: String },
    subtitle: { type: String },
    body: { type: String },
    updated_at: { type: Date, default: Date.now }
});

// --- models ---

const Admin = mongoose.model('Admin', adminSchema);
const Service = mongoose.model('Service', serviceSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Project = mongoose.model('Project', projectSchema);
const Content = mongoose.model('Content', contentSchema);

module.exports = { Admin, Service, Booking, Contact, Project, Content };
