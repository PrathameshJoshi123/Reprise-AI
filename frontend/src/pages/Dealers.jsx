import { useEffect, useState } from 'react';
import { Users, Search, Filter, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { fetchDealers } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Button } from '../components/ui.jsx';

export default function Dealers() {
  const [dealers, setDealers] = useState([]);
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedDealer, setSelectedDealer] = useState(null);

  useEffect(() => {
    const loadDealers = async () => {
      try {
        const response = await fetchDealers();
        setDealers(response.data);
        setFilteredDealers(response.data);
      } catch (error) {
        console.error('Error fetching dealers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, []);

  useEffect(() => {
    let filtered = dealers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(dealer => 
        dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // KYC status filter
    if (kycFilter !== 'all') {
      filtered = filtered.filter(dealer => dealer.kyc_status === kycFilter);
    }

    setFilteredDealers(filtered);
  }, [searchTerm, kycFilter, dealers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading dealers...</div>
      </div>
    );
  }

  const getKycBadge = (status) => {
    const config = {
      verified: { variant: 'success', icon: CheckCircle, label: 'Verified' },
      pending: { variant: 'warning', icon: Clock, label: 'Pending' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
    };
    const { variant, icon: Icon, label } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const verifiedDealers = dealers.filter(d => d.kyc_status === 'verified').length;
  const pendingDealers = dealers.filter(d => d.kyc_status === 'pending').length;
  const totalPurchases = dealers.reduce((sum, d) => sum + d.total_purchases, 0);
  const totalRevenue = dealers.reduce((sum, d) => sum + d.total_value, 0);
  const pendingPayments = dealers.reduce((sum, d) => sum + d.pending_payments, 0);
  const activeBids = dealers.reduce((sum, d) => sum + d.active_bids, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dealer Management</h1>
        <p className="text-gray-500 mt-1">Manage dealer accounts, KYC verification, and transactions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dealers</p>
                <p className="text-3xl font-bold mt-2">{dealers.length}</p>
                <p className="text-xs text-gray-500 mt-1">{verifiedDealers} verified</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-3xl font-bold mt-2">{totalPurchases}</p>
                <p className="text-xs text-gray-500 mt-1">{activeBids} active bids</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">₹{(totalRevenue / 10000000).toFixed(1)}Cr</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-3xl font-bold mt-2">₹{(pendingPayments / 100000).toFixed(1)}L</p>
                <p className="text-xs text-gray-500 mt-1">{pendingDealers} KYC pending</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, contact person, location, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All KYC Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dealers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Dealers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{dealer.name}</div>
                        <div className="text-sm text-gray-500">{dealer.contact_person}</div>
                        <div className="text-xs text-gray-400">{dealer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dealer.location}</td>
                    <td className="px-6 py-4">{getKycBadge(dealer.kyc_status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{dealer.total_purchases}</div>
                        <div className="text-gray-500">{dealer.active_bids} active bids</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">₹{(dealer.total_value / 100000).toFixed(1)}L</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${dealer.pending_payments > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {dealer.pending_payments > 0 ? `₹${(dealer.pending_payments / 1000).toFixed(0)}K` : '₹0'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dealer.rating > 0 ? (
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="text-sm font-medium">{dealer.rating}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDealer(dealer)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredDealers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No dealers found matching your filters</p>
        </div>
      )}

      {/* Dealer Detail Modal */}
      {selectedDealer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedDealer.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{selectedDealer.id}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDealer(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Contact Person:</span>
                    <p className="font-medium">{selectedDealer.contact_person}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedDealer.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedDealer.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">{selectedDealer.location}</p>
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div>
                <h3 className="font-semibold mb-3">Business Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Purchases</p>
                    <p className="text-2xl font-bold">{selectedDealer.total_purchases}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold">₹{(selectedDealer.total_value / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Active Bids</p>
                    <p className="text-2xl font-bold">{selectedDealer.active_bids}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Credit Limit</p>
                    <p className="text-2xl font-bold">₹{(selectedDealer.credit_limit / 100000).toFixed(1)}L</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="font-semibold mb-3">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">KYC Status</span>
                    {getKycBadge(selectedDealer.kyc_status)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Rating</span>
                    <span className="flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-medium">{selectedDealer.rating || 'N/A'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Pending Payments</span>
                    <span className={`font-medium ${selectedDealer.pending_payments > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ₹{selectedDealer.pending_payments.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Registration Date</span>
                    <span className="font-medium">{new Date(selectedDealer.registration_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Last Purchase</span>
                    <span className="font-medium">
                      {selectedDealer.last_purchase ? new Date(selectedDealer.last_purchase).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedDealer.kyc_status === 'pending' && (
                  <>
                    <Button variant="primary" className="flex-1">
                      Approve KYC
                    </Button>
                    <Button variant="destructive" className="flex-1">
                      Reject KYC
                    </Button>
                  </>
                )}
                {selectedDealer.kyc_status === 'verified' && (
                  <>
                    <Button variant="outline" className="flex-1">
                      View Transactions
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Adjust Credit Limit
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

