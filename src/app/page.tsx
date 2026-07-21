"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Users, ShieldCheck, ArrowRight, BookOpen, Award, Heart, ChevronRight, Menu, X, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import NewsTicker from "@/components/NewsTicker";
import OurFaculty from "@/components/OurFaculty";
import PublicRatings from "@/components/PublicRatings";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-panel-light bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-brand-950 tracking-tight leading-none">Shree Himalaya</h1>
                <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mt-0.5">Basic School</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">About Us</a>
              <a href="#academics" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Academics</a>
              <Link href="/apply" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Admissions</Link>
              <button onClick={() => setIsContactOpen(true)} className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Contact Us</button>
              
              <div className="h-6 w-px bg-slate-200"></div>
              
              <Link href="/teacher/login" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff
              </Link>
              <Link href="/admin/login" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-brand-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Portal
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-brand-600 focus:outline-none p-2">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand-600 rounded-md">About Us</a>
              <a href="#academics" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand-600 rounded-md">Academics</a>
              <Link href="/apply" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand-600 rounded-md">Admissions</Link>
              <button onClick={() => { setIsMenuOpen(false); setIsContactOpen(true); }} className="w-full text-left block px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand-600 rounded-md">Contact Us</button>
              <div className="my-2 border-t border-slate-100"></div>
              <Link href="/teacher/login" className="flex items-center gap-3 px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand-600 rounded-md">
                <Users className="w-5 h-5 text-slate-500" />
                Teacher Portal
              </Link>
              <Link href="/admin/login" className="flex items-center gap-3 px-3 py-3 text-base font-semibold text-brand-600 bg-brand-50 rounded-md mt-2">
                <ShieldCheck className="w-5 h-5" />
                Admin Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden" style={{ backgroundImage: 'url("/school.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-white/85 z-0 backdrop-blur-[2px]"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-200 text-brand-800 mb-8 backdrop-blur-md shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-accent-500"></span>
            <span className="text-sm font-semibold tracking-wide">Admissions open for 2026/2027</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Nurturing Minds, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800">Building Futures.</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
            Shree Himalaya Basic School provides a supportive, innovative, and inclusive learning environment where every child can discover their true potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 group">
              Apply Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#about" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
              Learn More
            </a>
          </div>
        </div>
        
        {/* Wave divider at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 md:h-24 text-slate-50 fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,120.4,188.8,107.5,233.1,97.69,277.62,77.53,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-extrabold text-brand-600 mb-2">500+</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Students</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-brand-600 mb-2">35+</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Expert Teachers</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-brand-600 mb-2">15</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Years of Excellence</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-brand-600 mb-2">100%</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Commitment</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-brand-600 font-bold tracking-widest uppercase text-sm mb-3">About Us</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Welcome to Shree Himalaya</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Discover our legacy of excellence, our core values, and where we are located.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* School Details */}
            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900">Our Mission</h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  To provide holistic education that combines academic rigor with character development. We strive to nurture young minds, fostering critical thinking, creativity, and a genuine love for learning that lasts a lifetime.
                </p>
              </div>

              <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900">Our Vision</h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  To be a leading center of educational excellence, shaping future leaders who are compassionate, confident, and prepared to tackle the challenges of tomorrow's world with integrity and innovation.
                </p>
              </div>
            </div>
            
            {/* Location & Contact Details */}
            <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900">Our Location</h4>
              </div>
              
              <div className="text-slate-600 mb-6 space-y-2">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-500" /> Bharatpur-11, Jagritichowk, Chitwan, Nepal</p>
                <p className="pl-6 text-sm">We are situated in a serene environment perfect for learning, easily accessible for all our students and staff.</p>
              </div>

              {/* Embed Map for Shree Himalaya Basic School */}
              <div className="flex-1 w-full min-h-[250px] bg-slate-200 rounded-xl overflow-hidden relative border border-slate-300">
                <iframe 
                  src="https://maps.google.com/maps?q=Shree+Himalaya+Basic+School,+Bharatpur-11,+Jagritichowk&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="School Location"
                  className="absolute inset-0"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="academics" className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors duration-300">
                <BookOpen className="w-7 h-7 text-brand-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">Academic Excellence</h4>
              <p className="text-slate-600 leading-relaxed">
                Our curriculum is designed to challenge and inspire students, fostering critical thinking, creativity, and a genuine love for learning.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors duration-300">
                <Award className="w-7 h-7 text-brand-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">Holistic Development</h4>
              <p className="text-slate-600 leading-relaxed">
                Beyond textbooks, we emphasize sports, arts, and extracurricular activities to ensure the well-rounded growth of every child.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 transition-colors duration-300">
                <Heart className="w-7 h-7 text-brand-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">Caring Community</h4>
              <p className="text-slate-600 leading-relaxed">
                A safe, inclusive, and supportive environment where teachers act as mentors and every student feels valued and respected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="admissions" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-900"></div>
        {/* Subtle patterned overlay could go here, omitting for simplicity */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-800/50 via-brand-900 to-brand-950"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to Join Our Community?</h2>
          <p className="text-xl text-brand-100 mb-10 font-light">
            Enrollments are now open for the upcoming academic year. Secure your child's future today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply" className="px-8 py-4 bg-accent-500 hover:bg-accent-400 text-brand-950 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1">
              Apply for Admission
            </Link>
          </div>
        </div>
      </section>
      
      <OurFaculty />
      
      <PublicRatings />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-800 rounded-lg">
                <GraduationCap className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight leading-none">Shree Himalaya</h2>
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-0.5">Basic School</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Empowering the next generation through quality education, moral values, and an inspiring learning environment. Located in the heart of the community.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-brand-400 transition-colors flex items-center gap-2 font-medium"><ChevronRight className="w-3 h-3 text-brand-500" /> Home</a></li>
              <li><a href="#about" className="hover:text-brand-400 transition-colors flex items-center gap-2 font-medium"><ChevronRight className="w-3 h-3 text-brand-500" /> About Us</a></li>
              <li><a href="#academics" className="hover:text-brand-400 transition-colors flex items-center gap-2 font-medium"><ChevronRight className="w-3 h-3 text-brand-500" /> Academics</a></li>
              <li><a href="#admissions" className="hover:text-brand-400 transition-colors flex items-center gap-2 font-medium"><ChevronRight className="w-3 h-3 text-brand-500" /> Admissions</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Portals</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/admin/login" className="hover:text-brand-400 transition-colors flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-brand-500" /> Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/teacher/login" className="hover:text-brand-400 transition-colors flex items-center gap-2 font-medium">
                  <Users className="w-4 h-4 text-brand-500" /> Teacher Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 pb-10 border-t border-slate-800 text-sm text-center text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Shree Himalaya Basic School. All rights reserved. | Exam Management System
        </div>
      </footer>
      
      {isContactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-brand-600 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold mb-1">Contact Us</h3>
                <p className="text-brand-100 text-sm">We'd love to hear from you!</p>
              </div>
              <button 
                onClick={() => setIsContactOpen(false)}
                className="text-brand-200 hover:text-white hover:bg-brand-500 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <a href="mailto:himalayabasicschool01@gmail.com" className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all group">
                <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Us</div>
                  <div className="font-medium text-slate-900">himalayabasicschool01@gmail.com</div>
                </div>
              </a>
              
              <a href="https://wa.me/9779855065451" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all group">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp</div>
                  <div className="font-medium text-slate-900">+977-9855065451</div>
                </div>
              </a>

              <a href="tel:+9779855065451" className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Call Us</div>
                  <div className="font-medium text-slate-900">+977-9855065451</div>
                </div>
              </a>

              <a href="#" className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                <div className="w-12 h-12 bg-[#1877F2]/10 text-[#1877F2] rounded-full flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z"/></svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facebook</div>
                  <div className="font-medium text-slate-900">Shree Himalaya Basic School</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
      
      <NewsTicker />
    </div>
  );
}
