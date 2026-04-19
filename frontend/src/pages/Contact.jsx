import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram, Music2, MessageCircle, BookOpen, Radio, ExternalLink } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const socialLinks = [
    {
        label: 'Facebook',
        subtitle: '@beautypanc',
        url: 'https://www.facebook.com/beautypanc',
        icon: Facebook,
    },
    {
        label: 'Instagram',
        subtitle: '@beautypandc',
        url: 'https://www.instagram.com/beautypandc',
        icon: Instagram,
    },
    {
        label: 'TikTok',
        subtitle: '@beauty.pc',
        url: 'https://www.tiktok.com/@beauty.pc',
        icon: Music2,
    },
    {
        label: 'WhatsApp Channel',
        subtitle: 'Join our updates channel',
        url: 'https://whatsapp.com/channel/0029Vaa30pmJuyAA3qmdJ61V',
        icon: Radio,
    },
    {
        label: 'WhatsApp Chat',
        subtitle: '+94 785 993 262',
        url: 'https://wa.me/94785993262',
        icon: MessageCircle,
    },
    {
        label: 'WhatsApp Catalog',
        subtitle: 'Browse products on WhatsApp',
        url: 'https://wa.me/c/94785993262',
        icon: BookOpen,
    },
    {
        label: 'Email',
        subtitle: 'beautypandc@gmail.com',
        url: 'mailto:beautypandc@gmail.com',
        icon: Mail,
    },
];

const Contact = () => {
    const { config } = useConfigStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('submitting');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        }, 1500);
    };

    return (
        <div className="bg-page min-h-screen py-12 sm:py-16 animate-fade-in">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 animate-slide-up">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-secondary">
                        Have a question about our products, an order, or just want to say hello? 
                        We'd love to hear from you. Drop us a line below.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 animate-slide-up-delayed-1">
                    
                    {/* Contact Information */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-default shadow-sm hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold text-primary mb-6">Contact Information</h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center text-brand flex-shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-primary mb-1">Email Us</p>
                                        <a href={`mailto:${config?.contactEmail || 'support@bpc.com'}`} className="text-secondary hover:text-brand transition-colors">
                                            {config?.contactEmail || 'support@bpc.com'}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center text-brand flex-shrink-0">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-primary mb-1">Call Us</p>
                                        <a href={`tel:${config?.contactPhone || '+1234567890'}`} className="text-secondary hover:text-brand transition-colors">
                                            {config?.contactPhone || '+1234567890'}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center text-brand flex-shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-primary mb-1">Our Location</p>
                                        <p className="text-secondary">
                                            123 Beauty Blossom Lane,<br />
                                            Cosmetics City, CC 90210
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center text-brand flex-shrink-0">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-primary mb-1">Business Hours</p>
                                        <p className="text-secondary">
                                            Monday - Friday: 9am - 6pm<br />
                                            Saturday: 10am - 4pm
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-default shadow-sm hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold text-primary mb-4">Follow & Chat With Us</h3>
                            <ul className="space-y-3">
                                {socialLinks.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.url}
                                            target={link.url.startsWith('http') ? '_blank' : undefined}
                                            rel={link.url.startsWith('http') ? 'noreferrer' : undefined}
                                            className="group flex items-center justify-between rounded-xl border border-default bg-page px-4 py-3 hover:border-brand hover:bg-brand-subtle/40 transition-all"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-surface border border-default flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                                                    <link.icon size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-primary leading-tight">{link.label}</p>
                                                    <p className="text-sm text-secondary truncate">{link.subtitle}</p>
                                                </div>
                                            </div>
                                            <ExternalLink size={16} className="text-tertiary group-hover:text-brand transition-colors" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-8">
                        <div className="bg-surface rounded-3xl p-6 sm:p-8 md:p-12 border border-default shadow-sm">
                            <h2 className="text-2xl font-bold text-primary mb-8">Send us a Message</h2>
                            
                            {status === 'success' ? (
                                <div className="bg-success-bg text-success p-6 rounded-2xl flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                                        <Send size={24} className="text-success ml-1" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                                    <p>Thank you for reaching out. We will get back to you within 24 hours.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-2">Your Name</label>
                                            <input 
                                                type="text" 
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                placeholder="Jane Doe"
                                                className="w-full bg-muted border border-default rounded-xl px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-2">Email Address</label>
                                            <input 
                                                type="email" 
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="jane@example.com"
                                                className="w-full bg-muted border border-default rounded-xl px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">Subject</label>
                                        <input 
                                            type="text" 
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            placeholder="How can we help?"
                                            className="w-full bg-muted border border-default rounded-xl px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">Message</label>
                                        <textarea 
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="5"
                                            placeholder="Write your message here..."
                                            className="w-full bg-muted border border-default rounded-xl px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={status === 'submitting'}
                                        className="btn-primary w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2"
                                    >
                                        {status === 'submitting' ? 'Sending...' : (
                                            <>
                                                Send Message
                                                <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Contact;
