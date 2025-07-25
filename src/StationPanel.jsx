import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaGasPump } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyBmZAMmxmHL6riRAOqDJC-f5P0fVtjhmqE",
  authDomain: "fuel-app-756ae.firebaseapp.com",
  projectId: "fuel-app-756ae",
  storageBucket: "fuel-app-756ae.appspot.com",
  messagingSenderId: "1075562726618",
  appId: "1:1075562726618:web:d2443d0589b697925251e3",
  measurementId: "G-E8WZYL0C1Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const StationPanel = () => {
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const startScanning = async () => {
    setError('');
    setOrderData(null);
    setLoading(false);

    const qrCodeScanner = new Html5Qrcode("qr-reader");
    scannerRef.current = qrCodeScanner;

    try {
      await qrCodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          setLoading(true);
          try {
            const parsed = JSON.parse(decodedText);
            setOrderData(parsed);
            const docRef = doc(db, 'orders', parsed.orderId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const fullData = snap.data();
              if (fullData.status === 'order_picked') {
                await updateDoc(docRef, {
                  status: 'order_delivered',
                  deliveredAt: new Date(),
                });
                alert('✅ Order marked as delivered!');
              } else {
                alert('⚠️ Order not yet picked by driver.');
              }
            } else {
              alert('❌ Order not found in Firestore');
            }
          } catch (e) {
            console.error(e);
            setError('❌ Invalid QR Code');
          } finally {
            setLoading(false);
            stopScanning(); // Optional: auto-stop after one scan
          }
        },
        (err) => {
          console.warn("Scan error:", err);
        }
      );
      setScanning(true);
    } catch (e) {
      console.error("Start scan failed:", e);
      setError('❌ Failed to start scanner');
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        setScanning(false);
      }
    } catch (err) {
      console.error("Stop error:", err);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #000, #111)',
      color: '#f5f5f5',
      padding: '2rem',
      fontFamily: 'Segoe UI, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#d4af37',
        marginBottom: '1.5rem'
      }}>
        <FaGasPump size={36} color="#d4af37" />
        <h2 style={{
          fontWeight: 600,
          fontSize: '1.8rem',
          margin: 0,
          borderBottom: '2px solid #d4af37',
          paddingBottom: '0.3rem'
        }}>
          Fuel Station Panel
        </h2>
      </div>

      <div id="qr-reader" style={{
        width: '320px',
        marginBottom: '20px',
        border: '2px solid #d4af37',
        borderRadius: '12px',
        padding: '1rem',
        backgroundColor: '#1a1a1a',
        minHeight: '280px'
      }}></div>

      {!scanning && (
        <button onClick={startScanning} style={buttonStyle}>
          ▶️ Start Scanning
        </button>
      )}

      {scanning && (
        <button onClick={stopScanning} style={{ ...buttonStyle, backgroundColor: '#ff4d4d' }}>
          ⛔ Stop Scanning
        </button>
      )}

      {loading && (
        <p style={{ color: '#d4af37', fontWeight: 500 }}>⏳ Processing...</p>
      )}

      {error && (
        <p style={{ color: '#ff4d4d', fontWeight: 500 }}>{error}</p>
      )}

      {orderData && (
        <div style={{
          background: '#1e1e1e',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 0 12px rgba(212, 175, 55, 0.3)',
          border: '1px solid #d4af37',
          maxWidth: '500px',
          width: '100%',
          marginTop: '1rem'
        }}>
          <h4 style={{ color: '#d4af37', marginBottom: '1rem' }}>📋 Order Summary</h4>
          {[
            ['Order ID', orderData.orderId],
            ['Customer', orderData.userName],
            ['Phone', orderData.phoneNumber],
            ['Fuel', orderData.fuelType],
            ['Type', orderData.fuelSubtype],
            ['Litres', orderData.quantity],
            ['Driver', `${orderData.driverName} (${orderData.driverPhone})`],
            ['Vehicle', orderData.driverVehicle],
            ['Payment Type', orderData.paymentType],
          ].map(([label, value], i) => (
            <p key={i} style={{ margin: '0.5rem 0' }}>
              <strong style={{ color: '#d4af37' }}>{label}:</strong> {value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const buttonStyle = {
  backgroundColor: '#d4af37',
  color: '#000',
  border: 'none',
  padding: '0.6rem 1.2rem',
  fontSize: '1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '1rem',
  fontWeight: 'bold',
};

export default StationPanel;
