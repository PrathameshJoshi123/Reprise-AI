import { useEffect, useState } from 'react';
import { Package, Search, Filter, Grid, List, Edit3, DollarSign } from 'lucide-react';
import { fetchInventory, updateDevicePrice } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Button } from '../components/ui.jsx';

export default function Inventory() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [priceModalDevice, setPriceModalDevice] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await fetchInventory();
        setDevices(response.data);
        setFilteredDevices(response.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const handlePriceAdjustment = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (!priceReason.trim()) {
      alert('Please provide a reason for price adjustment');
      return;
    }

    setUpdating(true);
    try {
      await updateDevicePrice(priceModalDevice.id, parseFloat(newPrice), priceReason);
      
      // Update local state
      const updatedDevices = devices.map(d => 
        d.id === priceModalDevice.id ? { ...d, price: parseFloat(newPrice) } : d
      );
      setDevices(updatedDevices);
      
      alert('Price updated successfully!');
      setPriceModalDevice(null);
      setNewPrice('');
      setPriceReason('');
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price');
    } finally {
      setUpdating(false);
    }
  };

  const openPriceModal = (device) => {
    setPriceModalDevice(device);
    setNewPrice(device.price.toString());
    setPriceReason('');
  };

  useEffect(() => {
    let filtered = devices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.imei && device.imei.includes(searchTerm)) ||
        (device.serial_number && device.serial_number.includes(searchTerm))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(device => device.grade === gradeFilter);
    }

    setFilteredDevices(filtered);
  }, [searchTerm, statusFilter, gradeFilter, devices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const config = {
      available: { variant: 'success', label: 'Available' },
      refurbishing: { variant: 'warning', label: 'Refurbishing' },
      sold: { variant: 'default', label: 'Sold' },
    };
    const { variant, label } = config[status] || config.available;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getGradeBadge = (grade) => {
    const colors = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-blue-100 text-blue-800',
      'B': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[grade] || colors.A}`}>
        Grade {grade}
      </span>
    );
  };

  const availableCount = devices.filter(d => d.status === 'available').length;
  const refurbishingCount = devices.filter(d => d.status === 'refurbishing').length;
  const totalValue = devices.filter(d => d.status === 'available').reduce((sum, d) => sum + d.price, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 mt-1">Manage and track your device inventory</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-3xl font-bold mt-2">{devices.length}</p>
                <p className="text-xs text-gray-500 mt-1">{availableCount} available</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refurbishing</p>
                <p className="text-3xl font-bold mt-2">{refurbishingCount}</p>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold mt-2">₹{(totalValue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-gray-500 mt-1">Available stock</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by brand, model, IMEI, or serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="refurbishing">Refurbishing</option>
                <option value="sold">Sold</option>
              </select>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Grades</option>
                <option value="A+">Grade A+</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>

              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="overflow-hidden">
              <img
                src={device.photos[0]}
                alt={`${device.brand} ${device.model}`}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{device.brand} {device.model}</h3>
                    <p className="text-xs text-gray-500">
                      {device.imei ? `IMEI: ${device.imei}` : `S/N: ${device.serial_number}`}
                    </p>
                  </div>
                  {getGradeBadge(device.grade)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Condition</span>
                    <span className="text-sm font-medium">{device.condition}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="text-lg font-bold text-green-600">₹{device.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    {getStatusBadge(device.status)}
                  </div>
                  {device.refurbishment && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      {device.refurbishment}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Acquired: {new Date(device.acquired_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openPriceModal(device)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Adjust Price
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acquired</th>                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img src={device.photos[0]} alt="" className="h-10 w-10 rounded object-cover mr-3" />
                          <div>
                            <div className="font-medium">{device.brand} {device.model}</div>
                            <div className="text-xs text-gray-500">
                              {device.imei ? `IMEI: ${device.imei}` : `S/N: ${device.serial_number}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{device.id}</td>
                      <td className="px-6 py-4">{getGradeBadge(device.grade)}</td>
                      <td className="px-6 py-4 text-sm">{device.condition}</td>
                      <td className="px-6 py-4 text-sm font-semibold">₹{device.price.toLocaleString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(device.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(device.acquired_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPriceModal(device)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDevices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No devices found matching your filters</p>
        </div>
      )}

      {/* Price Adjustment Modal */}
      {priceModalDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Adjust Price
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setPriceModalDevice(null)}
                  disabled={updating}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Device Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={priceModalDevice.photos[0]} 
                    alt="" 
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{priceModalDevice.brand} {priceModalDevice.model}</h3>
                    <p className="text-sm text-gray-600">
                      {priceModalDevice.imei ? `IMEI: ${priceModalDevice.imei}` : `S/N: ${priceModalDevice.serial_number}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getGradeBadge(priceModalDevice.grade)}
                      {getStatusBadge(priceModalDevice.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Price
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{priceModalDevice.price.toLocaleString()}
                </div>
              </div>

              {/* New Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Enter new price"
                    className="pl-8"
                    min="0"
                    step="100"
                    disabled={updating}
                  />
                </div>
                {newPrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    Difference: {parseFloat(newPrice) - priceModalDevice.price > 0 ? '+' : ''}
                    ₹{(parseFloat(newPrice) - priceModalDevice.price).toLocaleString()}
                    {' '}({((parseFloat(newPrice) - priceModalDevice.price) / priceModalDevice.price * 100).toFixed(1)}%)
                  </p>
                )}
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  placeholder="e.g., Market price correction, Better condition than expected, Competitive pricing..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="3"
                  disabled={updating}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPriceModalDevice(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handlePriceAdjustment}
                  disabled={updating || !newPrice || !priceReason.trim()}
                >
                  {updating ? 'Updating...' : 'Update Price'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

