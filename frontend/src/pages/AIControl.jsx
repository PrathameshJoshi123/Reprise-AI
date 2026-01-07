import { useEffect, useState } from 'react';
import { Brain, AlertTriangle, TrendingDown, TrendingUp, Minus, Image, CheckCircle, XCircle } from 'lucide-react';
import { fetchAnomalies, fetchMarketTrends, fetchPhotos } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '../components/ui.jsx';

export default function AIControl() {
  const [anomalies, setAnomalies] = useState([]);
  const [marketTrends, setMarketTrends] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [anomaliesRes, trendsRes] = await Promise.all([
          fetchAnomalies(),
          fetchMarketTrends()
        ]);
        
        setAnomalies(anomaliesRes.data);
        setMarketTrends(trendsRes.data);
      } catch (error) {
        console.error('Error fetching AI control data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleViewPhotos = async (transactionId) => {
    try {
      const response = await fetchPhotos(transactionId);
      setPhotos(response.data);
      setSelectedTransaction(transactionId);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading AI Control...</div>
      </div>
    );
  }

  const getVarianceBadge = (variance) => {
    if (variance < -20) return <Badge variant="danger">High Risk</Badge>;
    if (variance < -10) return <Badge variant="warning">Medium Risk</Badge>;
    if (variance > 10) return <Badge variant="info">Above Estimate</Badge>;
    return <Badge variant="success">Normal</Badge>;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const flaggedCount = anomalies.filter(a => a.status === 'flagged').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Control Center</h1>
        <p className="text-gray-500 mt-1">Monitor AI pricing accuracy and detect anomalies</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Anomalies</p>
                <p className="text-3xl font-bold mt-2">{anomalies.length}</p>
                <p className="text-xs text-gray-500 mt-1">{flaggedCount} flagged for review</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Models Active</p>
                <p className="text-3xl font-bold mt-2">3</p>
                <p className="text-xs text-gray-500 mt-1">Price, Image, Market</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Devices Tracked</p>
                <p className="text-3xl font-bold mt-2">{marketTrends.length}</p>
                <p className="text-xs text-gray-500 mt-1">Live market data</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Detection Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Price Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anomaly) => (
                  <TableRow key={anomaly.id}>
                    <TableCell className="font-medium">#{anomaly.transaction_id}</TableCell>
                    <TableCell>{anomaly.customer}</TableCell>
                    <TableCell>{anomaly.device}</TableCell>
                    <TableCell>₹{anomaly.estimated_price.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">₹{anomaly.final_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${anomaly.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {anomaly.variance > 0 ? '+' : ''}{anomaly.variance}%
                      </span>
                    </TableCell>
                    <TableCell>{getVarianceBadge(anomaly.variance)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewPhotos(anomaly.transaction_id)}
                      >
                        <Image className="h-4 w-4 mr-1" />
                        View Photos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Market Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketTrends.map((trend) => (
                <div key={trend.device_model} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-semibold">{trend.device_model}</p>
                    <p className="text-2xl font-bold mt-1">₹{trend.avg_price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Last updated: {trend.last_updated}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {getTrendIcon(trend.trend)}
                      <span className={`font-semibold ${getTrendColor(trend.trend)}`}>
                        {trend.price_change_percent > 0 ? '+' : ''}{trend.price_change_percent}%
                      </span>
                    </div>
                    <Badge 
                      variant={trend.trend === 'up' ? 'success' : trend.trend === 'down' ? 'danger' : 'default'}
                      className="mt-2"
                    >
                      {trend.trend.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photo Review Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600" />
              AI Photo Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTransaction ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Transaction #{selectedTransaction}</p>
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img 
                        src={photo.url} 
                        alt={`Device photo ${photo.id}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {photo.ai_detected_issues ? (
                        <div className="absolute top-2 right-2">
                          <XCircle className="h-6 w-6 text-red-500 bg-white rounded-full" />
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                      <div className="mt-2 text-xs">
                        {photo.ai_analysis.cracks && <Badge variant="danger" className="mr-1">Cracks</Badge>}
                        {photo.ai_analysis.scratches && <Badge variant="warning" className="mr-1">Scratches</Badge>}
                        {photo.ai_analysis.dents && <Badge variant="warning">Dents</Badge>}
                        {!photo.ai_detected_issues && <Badge variant="success">Good Condition</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Select a transaction to view photos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

