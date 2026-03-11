import { useState } from 'react';
import { Search, Phone, Mail, Calendar, Plus, Clock, User, MapPin, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { frubixService, type FrubixClient, type FrubixAppointment } from '../../services/frubix';

interface FrubixPanelProps {
  projectId: string;
}

export function FrubixPanel({ projectId }: FrubixPanelProps) {
  return (
    <Tabs defaultValue="clients" className="mt-6">
      <TabsList>
        <TabsTrigger value="clients">
          <User className="h-4 w-4 mr-1.5" />
          Clients
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Calendar className="h-4 w-4 mr-1.5" />
          Schedule
        </TabsTrigger>
      </TabsList>

      <TabsContent value="clients" className="mt-4">
        <ClientLookup projectId={projectId} />
      </TabsContent>

      <TabsContent value="schedule" className="mt-4">
        <ScheduleView projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}

/* ── Client Lookup ─────────────────────────────────────── */

function ClientLookup({ projectId }: { projectId: string }) {
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone');
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<FrubixClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedClient, setSelectedClient] = useState<FrubixClient | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Enter a search value');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = searchType === 'phone' ? { phone: query } : { email: query };
      const res = await frubixService.searchClients(projectId, params);
      const data = (res as any)?.data ?? [];
      setClients(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to search clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Search Frubix Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex rounded-md border border-gray-200 overflow-hidden">
              <button
                onClick={() => setSearchType('phone')}
                className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  searchType === 'phone' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                Phone
              </button>
              <button
                onClick={() => setSearchType('email')}
                className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors border-l ${
                  searchType === 'email' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
            </div>
            <Input
              placeholder={searchType === 'phone' ? 'Enter phone number...' : 'Enter email address...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching...
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No clients found
            </div>
          ) : (
            clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:border-indigo-200 transition-colors"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {client.phone && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                          )}
                          {client.email && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                  {selectedClient.company_name && (
                    <p className="text-sm text-gray-500">{selectedClient.company_name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedClient.phone && (
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="text-gray-700">{selectedClient.phone}</p>
                  </div>
                )}
                {selectedClient.email && (
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="text-gray-700">{selectedClient.email}</p>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs">Address</p>
                    <p className="text-gray-700">{selectedClient.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Schedule View ─────────────────────────────────────── */

function ScheduleView({ projectId }: { projectId: string }) {
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [appointments, setAppointments] = useState<FrubixAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    scheduled_date: '',
    scheduled_time: '',
    duration: '60',
    job_type: '',
    notes: '',
    address: '',
  });
  const [booking, setBooking] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    setFetched(true);
    try {
      const res = await frubixService.getSchedule(projectId, { date_from: dateFrom, date_to: dateTo });
      const data = (res as any)?.data ?? [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load schedule');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!bookingData.customer_name || !bookingData.scheduled_date) {
      toast.error('Customer name and date are required');
      return;
    }
    setBooking(true);
    try {
      await frubixService.createAppointment(projectId, {
        ...bookingData,
        duration: parseInt(bookingData.duration) || 60,
      });
      toast.success('Appointment booked!');
      setShowBookDialog(false);
      setBookingData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        scheduled_date: '',
        scheduled_time: '',
        duration: '60',
        job_type: '',
        notes: '',
        address: '',
      });
      fetchSchedule();
    } catch {
      toast.error('Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const statusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Frubix Schedule</CardTitle>
            <Button size="sm" onClick={() => setShowBookDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Book Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button onClick={fetchSchedule} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Load
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetched && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading schedule...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No appointments found for this date range
            </div>
          ) : (
            appointments.map((appt) => (
              <Card key={appt.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {appt.customer_name || 'Unnamed'}
                        </p>
                        {appt.status && (
                          <Badge className={`text-xs ${statusColor(appt.status)}`}>
                            {appt.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {(appt.scheduled_at || appt.scheduled_date) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {appt.scheduled_at
                              ? new Date(appt.scheduled_at).toLocaleString()
                              : `${appt.scheduled_date} ${appt.scheduled_time || ''}`}
                          </span>
                        )}
                        {appt.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appt.duration} min
                          </span>
                        )}
                        {appt.job_type && (
                          <span>{appt.job_type}</span>
                        )}
                      </div>
                      {appt.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {appt.address}
                        </p>
                      )}
                    </div>
                    {appt.customer_phone && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {appt.customer_phone}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Book Appointment Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={bookingData.customer_name}
                onChange={(e) => setBookingData((d) => ({ ...d, customer_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={bookingData.customer_phone}
                  onChange={(e) => setBookingData((d) => ({ ...d, customer_phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={bookingData.customer_email}
                  onChange={(e) => setBookingData((d) => ({ ...d, customer_email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={bookingData.scheduled_date}
                  onChange={(e) => setBookingData((d) => ({ ...d, scheduled_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={bookingData.scheduled_time}
                  onChange={(e) => setBookingData((d) => ({ ...d, scheduled_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={bookingData.duration}
                  onChange={(e) => setBookingData((d) => ({ ...d, duration: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Job Type</Label>
              <Input
                value={bookingData.job_type}
                onChange={(e) => setBookingData((d) => ({ ...d, job_type: e.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={bookingData.address}
                onChange={(e) => setBookingData((d) => ({ ...d, address: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={bookingData.notes}
                onChange={(e) => setBookingData((d) => ({ ...d, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>Cancel</Button>
            <Button onClick={handleBook} disabled={booking}>
              {booking ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
