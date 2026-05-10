import { Link } from 'react-router-dom';
import {
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
  HiOutlineArrowRight,
  HiOutlineCheck,
} from 'react-icons/hi';

const features = [
  { icon: HiOutlineCube, title: 'Product Management', desc: 'Track every SKU, category, and stock level in real-time across your entire inventory.' },
  { icon: HiOutlineChartBar, title: 'Advanced Reports', desc: 'Sales analytics, inventory valuation, and stock movement reports with beautiful charts.' },
  { icon: HiOutlineUsers, title: 'Team Collaboration', desc: 'Add staff, suppliers, and admins — each with role-based access to the right data.' },
  { icon: HiOutlineShieldCheck, title: 'Secure & Isolated', desc: 'Each company gets a completely isolated workspace. Your data is never shared.' },
  { icon: HiOutlineTruck, title: 'Restock Automation', desc: 'Create restock requests, track shipments, and get email notifications on delivery.' },
  { icon: HiOutlineClipboardList, title: 'Audit Trail', desc: 'Full audit logs for every action — know who did what and when.' },
];

const steps = [
  { num: '01', title: 'Register Your Company', desc: 'Create a free account and set up your isolated workspace in seconds.' },
  { num: '02', title: 'Add Your Team', desc: 'Invite staff and suppliers with role-based permissions.' },
  { num: '03', title: 'Start Managing', desc: 'Add products, record sales, track stock, and generate reports instantly.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600/20 rounded-xl flex items-center justify-center border border-primary-500/30">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">Invexis</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 text-dark-300 hover:text-white transition-colors font-medium text-sm">
              Sign In
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-600/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-8">
            <HiOutlineLightningBolt className="w-4 h-4" />
            Multi-Tenant SaaS Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-b from-white to-dark-400 bg-clip-text text-transparent">
              Smart Inventory
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              For Every Business
            </span>
          </h1>
          <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create your company's workspace, manage products, track sales, and collaborate with your team — all from one powerful platform.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-base transition-all shadow-xl shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5"
            >
              Start Free <HiOutlineArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-dark-800/50 hover:bg-dark-800 text-dark-200 rounded-xl font-semibold text-base transition-all border border-dark-700/50 hover:border-dark-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-white to-dark-400 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-dark-400 max-w-xl mx-auto">
              Powerful features designed for businesses of all sizes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 bg-dark-900/40 border border-dark-800/50 rounded-2xl hover:border-primary-500/30 hover:bg-dark-900/60 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-600/10 border border-primary-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-dark-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-white to-dark-400 bg-clip-text text-transparent">
              Up & Running in Minutes
            </h2>
            <p className="text-dark-400">Three simple steps to get started.</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-primary-600/10 border border-primary-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-primary-400 font-bold text-lg">{step.num}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-dark-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tenant Isolation Highlight */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-600/10 to-purple-600/10 border border-primary-500/20 rounded-3xl p-10 md:p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600/20 rounded-2xl mb-6 border border-primary-500/30">
              <HiOutlineGlobe className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Data Isolation</h2>
            <p className="text-dark-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Every company gets its own isolated workspace — products, staff, sales, and reports are completely separate. Your data is never visible to other tenants.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Isolated Workspaces', 'Role-Based Access', 'Encrypted Data', 'Audit Logging'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 px-4 py-2 bg-dark-900/60 border border-dark-700/50 rounded-full text-sm text-dark-200">
                  <HiOutlineCheck className="w-4 h-4 text-green-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-dark-400 mb-8">
            Create your company workspace and start managing inventory in minutes.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-lg transition-all shadow-xl shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5"
          >
            Register Your Company <HiOutlineArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600/20 rounded-lg flex items-center justify-center border border-primary-500/30">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-dark-400">Invexis</span>
          </div>
          <p className="text-dark-500 text-sm">&copy; {new Date().getFullYear()} Invexis. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
