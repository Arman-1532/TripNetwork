import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AiChatbot from './AiChatbot';

const Layout = ({ user, activeTab, setActiveTab, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
      />
      
      <main className="ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
        
        <footer className="mt-12 px-8 py-12 bg-surface-container border-t border-outline-variant/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-4">
              <div className="text-2xl font-black">TripNetwork</div>
              <p className="text-on-surface-variant max-w-sm">

                Our mission is to transform travel into a seamless, editorial-quality journey.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold uppercase text-[10px] tracking-widest text-on-surface-variant">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a className="hover:text-primary transition-colors" href="#">Destinations</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Private Charters</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Journal</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold uppercase text-[10px] tracking-widest text-on-surface-variant">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </main>
      <AiChatbot />
    </div>
  );
};

export default Layout;
