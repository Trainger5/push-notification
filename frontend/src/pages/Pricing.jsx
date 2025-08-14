import { Link as RouterLink } from 'react-router-dom'
import '../styles/notifypro.css'

export default function Pricing() {
	const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null
	return (
		<div className="np-page">
			<div className="np-gradient-bg" />
			<div className="np-glass-overlay" />
			<nav className="np-nav">
				<div className="np-nav-inner">
					<RouterLink className="np-logo" to="/">NotifyPro</RouterLink>
					<ul className="np-nav-links">
						<li><RouterLink to="/">Home</RouterLink></li>
						<li><RouterLink to="/pricing">Pricing</RouterLink></li>
						<li><RouterLink to="/docs">Docs</RouterLink></li>
						{!role && <li><RouterLink to="/login">Login</RouterLink></li>}
						{role && (role === 'admin' ? (
							<li><RouterLink to="/admin-dashboard">Dashboard</RouterLink></li>
						) : (
							<li><RouterLink to="/app">Dashboard</RouterLink></li>
						))}
					</ul>
					{!role ? (
						<RouterLink className="np-btn np-btn-primary" to="/login">Get Started</RouterLink>
					) : (
						<RouterLink className="np-btn np-btn-secondary" to="/login" onClick={() => { try { localStorage.removeItem('token'); localStorage.removeItem('role'); } catch(_){} }}>Logout</RouterLink>
					)}
				</div>
			</nav>
			<section className="np-pricing-hero">
				<h1>Simple, Transparent Pricing (INR)</h1>
				<p>Choose the perfect plan for your business. No hidden fees, cancel anytime.</p>
			</section>
			<div className="np-pricing-grid">
				<div className="np-pricing-card">
					<h3>Starter</h3>
					<div className="np-price">₹2,399<span>/month</span></div>
					<ul className="np-pricing-features">
						<li>Up to 50K notifications/month</li>
						<li>Basic targeting & segmentation</li>
						<li>Email support</li>
						<li>Standard analytics</li>
						<li>API access</li>
					</ul>
					<RouterLink className="np-btn np-btn-primary" style={{ width: '100%' }} to="/login">Get Started</RouterLink>
				</div>
				<div className="np-pricing-card popular">
					<h3>Professional</h3>
					<div className="np-price">₹8,199<span>/month</span></div>
					<ul className="np-pricing-features">
						<li>Up to 500K notifications/month</li>
						<li>Advanced targeting & automation</li>
						<li>Priority support</li>
						<li>A/B testing + Webhooks</li>
						<li>Custom scheduling</li>
					</ul>
					<RouterLink className="np-btn np-btn-primary" style={{ width: '100%' }} to="/login">Start Free Trial</RouterLink>
				</div>
				<div className="np-pricing-card">
					<h3>Enterprise</h3>
					<div className="np-price">Custom</div>
					<ul className="np-pricing-features">
						<li>Unlimited notifications</li>
						<li>Custom integrations</li>
						<li>24/7 dedicated support</li>
						<li>White-label solution</li>
						<li>SLAs</li>
					</ul>
					<a className="np-btn np-btn-secondary" style={{ width: '100%', textAlign: 'center' }} href="mailto:sales@example.com">Contact Sales</a>
				</div>
			</div>
		</div>
	)
}


