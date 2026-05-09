import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, Activity, AlertTriangle, Table, LayoutGrid, TrendingUp, 
  DollarSign, BarChart3, Save, X 
} from 'lucide-react';
import DataGrid from './DataGrid';
import Swal from 'sweetalert2';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('grid'); // جعلنا عرض البطاقات هو الافتراضي للذكاء
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // حالة النموذج الجديد لإضافة صنف
  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'كيلو',
    balance: '',
    price: '',
    category: 'raw'
  });

  // حسابات إحصائية بنظام ERP
  const stats = useMemo(() => {
    const totalValue = gridData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const lowStockCount = gridData.filter(item => parseFloat(item.balance) < 5 && item.name).length;
    return { totalValue, lowStockCount };
  }, [gridData]);

  useEffect(() => {
    const lowStockItems = gridData.filter(item =>
      item.name && item.balance !== '' && parseFloat(item.balance) < 5
    );
    setAlerts(lowStockItems);
  }, [gridData]);

  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw'
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));

    const initialRows = filtered.map(cat => ({
      ...cat,
      total: (parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0),
    }));

    setGridData(initialRows);
  }, [activeTab, categories]);

  // دالة الحفظ الجديدة للمزامنة مع App.jsx والقاعدة
  const handleAddNewItem = () => {
    if (!newItem.name || !newItem.balance || !newItem.price) {
      Swal.fire({ title: 'نقص بيانات', text: 'يرجى ملء جميع الحقول الأساسية', icon: 'warning', timer: 2000 });
      return;
    }

    const itemToAdd = {
      ...newItem,
      id: `item-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      balance: parseFloat(newItem.balance),
      price: parseFloat(newItem.price),
      total: parseFloat(newItem.balance) * parseFloat(newItem.price)
    };

    // إرسال البيانات للأب (App.jsx) ليقوم بحفظها في localStorage أو قاعدة البيانات
    if (onAddItem) {
      onAddItem(itemToAdd);
    } else if (setStock) {
      setStock(prev => [...prev, itemToAdd]);
    }

    Swal.fire({ title: 'تمت الإضافة', text: 'تم تسجيل الصنف بنجاح في المخزن', icon: 'success', timer: 1500 });
    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '', category: 'raw' });
  };

  // بطاقة المنتج الذكية (ERP Card)
  const ProductCard = ({ item }) => (
    <div className="glass-card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ background: '#1e563120', padding: '10px', borderRadius: '12px' }}>
          <Package size={20} color="#1e5631" />
        </div>
        <button onClick={() => handleDeleteProcess(item.id)} style={{ border: 'none', background: 'none', color: '#ef4444' }}>
          <Trash2 size={18} />
        </button>
      </div>
      
      <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 'bold' }}>{item.name}</h3>
      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>وحدة القياس: {item.unit}</span>

      <div style={cardGridStyle}>
        <div>
          <p style={labelSmall}>الرصيد</p>
          <p style={{ ...valueMedium, color: parseFloat(item.balance) < 5 ? '#ef4444' : '#1e293b' }}>
            {item.balance}
          </p>
        </div>
        <div>
          <p style={labelSmall}>التكلفة/وحدة</p>
          <p style={valueMedium}>{parseFloat(item.price).toLocaleString()} ج.م</p>
        </div>
      </div>

      <div style={cardFooterStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <DollarSign size={14} />
          <span>إجمالي القيمة:</span>
        </div>
        <span style={{ fontWeight: 'bold' }}>{(item.balance * item.price).toLocaleString()} ج.م</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '120px' }}>
      
      {/* قسم الإحصائيات الذكي */}
      <div style={statsContainer}>
        <div style={statBox}>
          <BarChart3 size={20} color="#1e5631" />
          <div style={{ marginRight: '10px' }}>
            <p style={labelSmall}>قيمة المخزون</p>
            <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>{stats.totalValue.toLocaleString()} ج.م</p>
          </div>
        </div>
        <div style={{ ...statBox, borderRight: '4px solid #ef4444' }}>
          <TrendingUp size={20} color="#ef4444" />
          <div style={{ marginRight: '10px' }}>
            <p style={labelSmall}>أصناف منخفضة</p>
            <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>{stats.lowStockCount} صنف</p>
          </div>
        </div>
      </div>

      {/* الرأس والأزرار */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>المستودع الذكي</h2>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtnMain}>
          <Plus size={20} /> إضافة صنف جديد
        </button>
      </div>

      {/* تبديل التبويبات */}
      <div style={tabContainer}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabStyle : tabStyle}>
          <Layers size={18} /> المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabStyle : tabStyle}>
          <Archive size={18} /> المنتج النهائي
        </button>
      </div>

      {/* عرض البيانات */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {gridData.map(item => <ProductCard key={item.id} item={item} />)}
          {gridData.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', gridColumn: '1/-1' }}>لا توجد بيانات متاحة حالياً</p>}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '10px' }}>
           <DataGrid data={gridData} columns={gridColumns} onCellEdit={handleCellEdit} />
        </div>
      )}

      {/* نافذة إضافة منتج (ERP Modal) */}
      {isAddModalOpen && (
        <div style={modalOverlay}>
          <div className="glass-card" style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>تخزين صنف جديد</h3>
              <X onClick={() => setIsAddModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <div style={formGroup}>
              <label style={labelSmall}>اسم الصنف</label>
              <input 
                style={inputStyle} 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                placeholder="مثال: دقيق فاخر"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={formGroup}>
                <label style={labelSmall}>الكمية</label>
                <input 
                  type="number" 
                  style={inputStyle} 
                  value={newItem.balance} 
                  onChange={e => setNewItem({...newItem, balance: e.target.value})}
                />
              </div>
              <div style={formGroup}>
                <label style={labelSmall}>سعر الوحدة</label>
                <input 
                  type="number" 
                  style={inputStyle} 
                  value={newItem.price} 
                  onChange={e => setNewItem({...newItem, price: e.target.value})}
                />
              </div>
            </div>

            <button onClick={handleAddNewItem} style={saveBtn}>
              <Save size={18} /> حفظ وتحديث القاعدة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات المضافة (ERP Style)
const statsContainer = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' };
const statBox = { background: '#fff', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRight: '4px solid #1e5631' };
const labelSmall = { fontSize: '0.7rem', color: '#64748b', margin: 0 };
const valueMedium = { fontSize: '1rem', fontWeight: 'bold', margin: 0 };
const cardStyle = { background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };
const cardGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px', padding: '10px 0', borderTop: '1px dashed #e2e8f0' };
const cardFooterStyle = { marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#1e5631', background: '#f0fdf4', padding: '8px', borderRadius: '10px' };
const tabContainer = { display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '20px' };
const tabStyle = { flex: 1, padding: '10px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const activeTabStyle = { ...tabStyle, background: '#fff', color: '#1e5631', fontWeight: 'bold', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
const addBtnMain = { background: '#1e5631', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent = { background: '#fff', width: '100%', maxWidth: '400px', padding: '25px', borderRadius: '25px' };
const formGroup = { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' };
const saveBtn = { width: '100%', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };

export default Inventory;
