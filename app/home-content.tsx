'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

export function HomeContent() {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'canceled' | 'error'>('idle');
  const [license, setLicense] = useState('');
  const [timer, setTimer] = useState('23:47:12');
  const [payError, setPayError] = useState("");
  const [activateKey, setActivateKey] = useState('');
  const [activateStatus, setActivateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activateMessage, setActivateMessage] = useState('');
  const [manualActivateLoading, setManualActivateLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);

  const PRICE = process.env.NEXT_PUBLIC_PRODUCT_PRICE || '14.99';

  // 检查用户付费状态
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (sessionStatus === 'authenticated' && session?.user?.email) {
        try {
          const res = await fetch('/api/user/status');
          if (res.ok) {
            const data = await res.json();
            setIsPaid(data.isPaid === true);
          }
        } catch (err) {
          console.error('Payment check failed:', err);
        }
      }
      setCheckingPayment(false);
    };

    if (sessionStatus !== 'loading') {
      checkPaymentStatus();
    }
  }, [sessionStatus, session]);

  // 处理 URL 状态回调
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const licenseFromBackend = params.get('license');
    const paid = params.get('paid');
    if (params.get('success')) {
      setStatus('success');
      if (licenseFromBackend) setLicense(licenseFromBackend);
      if (paid) {
        // 自动激活付费状态
        handleAutoActivate();
      }
    } else if (params.get('canceled')) {
      setStatus('canceled');
    } else if (params.get('error')) {
      setStatus('error');
    }
  }, []);

  // 自动激活（支付成功后调用）
  const handleAutoActivate = async () => {
    setActivateStatus('loading');
    setActivateMessage('Activating your account...');
    
    try {
      // 尝试激活，最多重试3次
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`Auto activation attempt ${attempts}...`);
        
        const res = await fetch('/api/test-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (res.ok) {
          success = true;
          setActivateStatus('success');
          setActivateMessage('🎉 Payment successful! Redirecting to app...');
          // 2秒后自动跳转到重构页面
          setTimeout(() => {
            window.location.href = '/refactor';
          }, 2000);
        } else {
          console.log(`Activation attempt ${attempts} failed:`, data.error);
          if (attempts < 3) {
            // 等待1秒后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!success) {
        // 自动激活失败，显示手动激活按钮
        setActivateStatus('error');
        setActivateMessage('Auto-activation failed. Please click the button below to activate manually.');
      }
    } catch (err: any) {
      console.error('Auto activation error:', err);
      setActivateStatus('error');
      setActivateMessage('Activation error. Please try clicking the activate button below.');
    }
  };

  // 修复倒计时逻辑：基于函数式更新
  useEffect(() => {
    const id = setInterval(() => {
      setTimer((prev) => {
        const parts = prev.split(':').map(Number);
        let totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        
        if (totalSeconds <= 0) {
          clearInterval(id);
          return '00:00:00';
        }
        
        totalSeconds--;
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // 支付函数：增加健壮性处理
  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    setStatus('idle');
    setPayError("");
    try {
      const res = await fetch('/api/paypal/create-order', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'API request failed');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setPayError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (sessionStatus === 'authenticated') {
      if (isPaid) {
        // 已付费，跳转到工作页面
        window.location.href = '/refactor';
      } else {
        // 已登录但未付费，跳转到定价页面
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // 未登录，先登录
      signIn('google', { callbackUrl: '/refactor' });
    }
  };

  // 手动激活（支付后使用）
  const handleManualActivate = async () => {
    setManualActivateLoading(true);
    try {
      const res = await fetch('/api/test-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok) {
        setActivateStatus('success');
        setActivateMessage('✅ Activated! Redirecting to app...');
        setTimeout(() => {
          window.location.href = '/refactor';
        }, 2000);
      } else {
        setActivateStatus('error');
        setActivateMessage(data.error || 'Activation failed');
      }
    } catch (err: any) {
      setActivateStatus('error');
      setActivateMessage(err.message);
    }
    setManualActivateLoading(false);
  };

  const handleActivate = async () => {
    if (!activateKey.trim() || !session?.user?.email) return;
    
    setActivateStatus('loading');
    setActivateMessage('');
    
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          licenseKey: activateKey.trim(),
          email: session.user.email 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setActivateStatus('success');
        setActivateMessage(data.message || 'Activated successfully!');
        setActivateKey('');
      } else {
        setActivateStatus('error');
        setActivateMessage(data.error || 'Activation failed');
      }
    } catch (err: any) {
      setActivateStatus('error');
      setActivateMessage(err.message || 'Activation error');
    }
  };

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #eff6ff, #f8fafc 40%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px',
      color: '#1e293b',
    },
    hero: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '80px 24px 48px',
      textAlign: 'center',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: '#fff',
      color: '#2563eb',
      fontSize: '13px',
      fontWeight: 600,
      padding: '6px 16px',
      borderRadius: '99px',
      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)',
      marginBottom: '24px',
    },
    h1: {
      fontSize: '48px',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      margin: '0 0 20px',
      background: 'linear-gradient(to bottom right, #0f172a, #334155)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    heroSub: {
      fontSize: '19px',
      color: '#475569',
      lineHeight: 1.6,
      maxWidth: '600px',
      margin: '0 auto 32px',
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '24px',
      maxWidth: '1000px',
      margin: '0 auto 64px',
      padding: '0 24px',
    },
    featCard: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid #fff',
      borderRadius: '24px',
      padding: '32px',
      transition: 'transform 0.2s ease',
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
    },
    featIcon: {
      fontSize: '32px',
      marginBottom: '20px',
      display: 'block',
    },
    featTitle: {
      fontSize: '18px',
      fontWeight: 700,
      margin: '0 0 16px',
    },
    featItem: {
      fontSize: '14px',
      color: '#64748b',
      display: 'flex',
      gap: '10px',
      marginBottom: '10px',
    },
    priceWrap: {
      maxWidth: '520px',
      margin: '0 auto 80px',
      padding: '0 24px',
    },
    priceCard: {
      background: '#fff',
      border: '2px solid #2563eb',
      borderRadius: '32px',
      padding: '48px 40px',
      textAlign: 'center',
      position: 'relative' as const,
      boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.15)',
    },
    popularBadge: {
      position: 'absolute' as const,
      top: '-14px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#2563eb',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 700,
      padding: '4px 16px',
      borderRadius: '99px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    priceOld: {
      fontSize: '24px',
      color: '#94a3b8',
      textDecoration: 'line-through',
      marginRight: '12px',
    },
    priceNew: {
      fontSize: '64px',
      fontWeight: 800,
      color: '#0f172a',
    },
    timerVal: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#b45309',
      background: '#fffbeb',
      padding: '6px 12px',
      borderRadius: '8px',
      border: '1px solid #fde68a',
    },
    btn: {
      width: '100%',
      padding: '18px',
      borderRadius: '16px',
      border: 'none',
      background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
      color: '#fff',
      fontSize: '18px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.8 : 1,
      transition: 'all 0.2s ease',
      boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
    },
  };

  return (
    <div style={S.page}>
      {/* 导航栏 */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ fontWeight: 800, fontSize: '20px', color: '#2563eb' }}>
          CleanRefactor
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {sessionStatus === 'authenticated' ? (
            <>
              <span style={{ color: '#64748b', fontSize: '14px' }}>{session?.user?.email}</span>
              {isPaid ? (
                <Link href="/refactor" style={{
                  background: '#2563eb',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  Start Refactoring
                </Link>
              ) : (
                <button 
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  💎 Upgrade PRO
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={() => signIn('google', { callbackUrl: '/refactor' })}
              style={{
                background: 'transparent',
                border: '1px solid #2563eb',
                color: '#2563eb',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* 顶部 Hero */}
      <div style={S.hero}>
        <div style={S.badge}>
          <span>✦</span> Trusted by 1,200+ Developers
        </div>
        <h1 style={S.h1}>Refactor Messy Code <br/> in Seconds with AI</h1>
        <p style={S.heroSub}>
          Ship cleaner products faster. Automatically fix logic, improve structure, 
          and enforce best practices across your entire frontend stack.
        </p>
        
        {/* CTA 按钮组 */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleStart}
            disabled={checkingPayment}
            style={{
              background: '#2563eb',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 700,
              cursor: checkingPayment ? 'not-allowed' : 'pointer',
              opacity: checkingPayment ? 0.7 : 1,
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
            }}
          >
            {checkingPayment 
              ? 'Loading...' 
              : sessionStatus === 'authenticated' 
                ? (isPaid ? '🚀 Start Refactoring' : '💎 Upgrade to PRO')
                : '🔐 Login to Use'
            }
          </button>
          
          {/* 已支付用户快速激活 */}
          {sessionStatus === 'authenticated' && status !== 'success' && (
            <button 
              onClick={handleManualActivate}
              disabled={manualActivateLoading}
              style={{
                background: '#10b981',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 700,
                cursor: manualActivateLoading ? 'not-allowed' : 'pointer',
                opacity: manualActivateLoading ? 0.7 : 1,
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
              }}
            >
              {manualActivateLoading ? 'Activating...' : '✅ I\'ve Paid - Activate Now'}
            </button>
          )}
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: '#fff',
              color: '#2563eb',
              padding: '14px 28px',
              borderRadius: '12px',
              border: '2px solid #2563eb',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            View Pricing
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>
          {sessionStatus === 'authenticated' ? 'Welcome back!' : 'Login required to use the tool'}
        </p>
      </div>

      {/* 特性展示 */}
      <div style={S.features}>
        {[
          {
            icon: '🧹',
            title: 'Code Deep Clean',
            items: ['Dead code elimination', 'Auto-fix imports', 'Logic simplification'],
          },
          {
            icon: '⚡',
            title: 'Modern Architecture',
            items: ['Hook extraction', 'Prop-types conversion', 'Naming consistency'],
          },
          {
            icon: '🔒',
            title: 'Forever Yours',
            items: ['One-time payment', 'No monthly bills', 'Free lifetime updates'],
          },
        ].map((f) => (
          <div key={f.title} style={S.featCard}>
            <span style={S.featIcon}>{f.icon}</span>
            <h3 style={S.featTitle}>{f.title}</h3>
            {f.items.map((item) => (
              <div key={item} style={S.featItem}>
                <span style={{ color: '#10b981' }}>✓</span> {item}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 核心支付卡片 */}
      <div id="pricing" style={S.priceWrap}>
        <div style={S.priceCard}>
          <div style={S.popularBadge}>Limited Launch Offer</div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={S.priceOld}>$49.99</span>
            <span style={S.priceNew}>${PRICE}</span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Lifetime License · Instant Delivery</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Flash sale ends in:</span>
            <span style={S.timerVal}>{timer}</span>
          </div>

          {/* 状态处理 UI */}
          {status === 'success' && (
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              padding: '32px', 
              borderRadius: '20px', 
              marginBottom: '24px', 
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <p style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Payment Successful!</p>
              <p style={{ fontSize: '16px', opacity: 0.95, marginBottom: '16px' }}>Welcome to CleanRefactor AI PRO</p>
              
              {/* 自动激活状态显示 */}
              {activateStatus === 'loading' && (
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    display: 'inline-block', 
                    width: '20px', 
                    height: '20px', 
                    border: '3px solid rgba(255,255,255,0.3)', 
                    borderTop: '3px solid #fff', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    marginRight: '10px',
                    verticalAlign: 'middle'
                  }} />
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>{activateMessage}</span>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
              
              {activateStatus === 'success' && (
                <>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '20px', 
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                    <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Account Activated!</p>
                    <p style={{ fontSize: '14px', opacity: 0.9 }}>{activateMessage}</p>
                  </div>
                  
                  {/* 订单详情 */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    padding: '16px', 
                    borderRadius: '12px',
                    marginBottom: '20px',
                    textAlign: 'left'
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>Order Details</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span>Product:</span>
                      <span>Lifetime License</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span>Price:</span>
                      <span>${PRICE}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Status:</span>
                      <span style={{ color: '#86efac' }}>✓ Active</span>
                    </div>
                  </div>
                  
                  {/* 立即使用按钮 */}
                  <Link href="/refactor" style={{
                    display: 'inline-block',
                    background: '#fff',
                    color: '#059669',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontSize: '18px',
                    fontWeight: 700,
                    boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s',
                  }}>
                    🚀 Start Using Now
                  </Link>
                </>
              )}
              
              {/* 自动激活失败时显示手动激活按钮 */}
              {activateStatus === 'error' && (
                <>
                  <div style={{ 
                    background: 'rgba(239,68,68,0.3)', 
                    padding: '12px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {activateMessage}
                  </div>
                  <button
                    onClick={handleManualActivate}
                    disabled={manualActivateLoading}
                    style={{
                      background: '#fff',
                      color: '#059669',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: manualActivateLoading ? 'not-allowed' : 'pointer',
                      opacity: manualActivateLoading ? 0.7 : 1,
                    }}
                  >
                    {manualActivateLoading ? 'Activating...' : '✅ Click to Activate'}
                  </button>
                </>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: 600, border: '2px solid #fecaca' }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>❌</span>
              Payment failed. {payError && <span style={{fontSize: '12px', opacity: 0.8}}>({payError})</span>}
            </div>
          )}
          
          {status === 'canceled' && (
            <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', marginBottom: '20px', color: '#92400e', fontSize: '14px', fontWeight: 600, border: '2px solid #fcd34d' }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>⚠️</span>
              Payment canceled. You can try again anytime.
            </div>
          )}

          <button 
            onClick={handlePay} 
            disabled={loading} 
            style={S.btn}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Connecting to PayPal...' : `Get Lifetime Access — $${PRICE}`}
          </button>
          
          <div style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🔒 Secure Checkout</span>
            <span>•</span>
            <span>30-Day Refund</span>
          </div>


        </div>
      </div>

      {/* FAQ 简易版 */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px', fontWeight: 800 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            { q: 'Is my code safe?', a: 'Yes. We process code locally in your browser or through encrypted ephemeral sessions. We never store your source code.' },
            { q: 'Can I use it for commercial projects?', a: 'Absolutely. The lifetime license covers both personal and professional commercial usage.' }
          ].map(f => (
            <div key={f.q} style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 700, marginBottom: '8px' }}>{f.q}</p>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '80px', textAlign: 'center', padding: '32px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '13px' }}>
        © 2026 CleanRefactor AI. Built for modern developers.
      </footer>
    </div>
  );
}
