import { useEffect, useState } from 'react';
import { getAllPropertyExtractions, deletePropertyExtraction } from '@/utils/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Search,
  FileText,
  Eye,
  CheckCircle2
} from 'lucide-react';

const PropertyExtractions = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await getAllPropertyExtractions({ 
        page, 
        limit: 20,
        search 
      });
      setProperties(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, search]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property extraction?')) {
      try {
        await deletePropertyExtraction(id);
        fetchProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const viewDetails = (property) => {
    setSelectedProperty(property);
    setIsDetailsOpen(true);
  };

  // Get the best address to display (prefer refined_address)
  const getDisplayAddress = (property) => {
    return property.refined_address || property.property_address;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF8F2]">
        <div className="text-lg text-[#3f4f24]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F2] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#3f4f24] mb-2">
            Property Extractions
          </h1>
          <p className="text-gray-600">
            Manage extracted property information from emails
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by address, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-[#3f4f24] focus:ring-[#3f4f24]"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4 text-[#D4A017]" />
            <span className="font-medium">{pagination.total || 0}</span> total properties
          </div>
          <div className="text-sm text-gray-500">
            Page {pagination.page || 1} of {pagination.totalPages || 1}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f7ee] hover:bg-[#f4f7ee]">
                  <TableHead className="font-semibold text-[#3f4f24]">Property Address</TableHead>
                  <TableHead className="font-semibold text-[#3f4f24]">Price</TableHead>
                  <TableHead className="font-semibold text-[#3f4f24]">Sender</TableHead>
                  <TableHead className="font-semibold text-[#3f4f24]">Company</TableHead>
                  <TableHead className="font-semibold text-[#3f4f24]">Email Date</TableHead>
                  <TableHead className="font-semibold text-[#3f4f24]">Confidence</TableHead>
                  <TableHead className="font-semibold text-[#3f4f24] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id} className="hover:bg-[#FDF8F2]">
                    <TableCell className="font-medium text-[#3f4f24] max-w-xs">
                      <div className="truncate">{getDisplayAddress(property)}</div>
                    </TableCell>
                    <TableCell>
                      {property.asking_price ? (
                        <span className="font-semibold text-[#3f4f24]">
                          {formatPrice(property.asking_price)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm">{property.from}</div>
                      {property.sender_email && (
                        <div className="truncate text-xs text-gray-500">{property.sender_email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.sender_company || <span className="text-gray-400">N/A</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {property.email_date ? (
                        new Date(property.email_date).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.confidence ? (
                        <Badge className={`${getConfidenceColor(property.confidence)} border text-xs`}>
                          {(property.confidence * 100).toFixed(0)}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewDetails(property)}
                          className="text-[#3f4f24] hover:text-[#3f4f24] hover:bg-[#e8efdc]"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(property.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-[#3f4f24] text-[#3f4f24] hover:bg-[#3f4f24] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.totalPages || 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= pagination.totalPages}
            className="border-[#3f4f24] text-[#3f4f24] hover:bg-[#3f4f24] hover:text-white"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#3f4f24]">Property Details</DialogTitle>
            <DialogDescription>
              Complete information about this property extraction
            </DialogDescription>
          </DialogHeader>
          
          {selectedProperty && (
            <div className="space-y-4 mt-4">
              {/* Address Section */}
              <div className="bg-[#f4f7ee] rounded-lg p-4">
                <h3 className="font-semibold text-[#3f4f24] mb-2">Address Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Display Address:</span> {getDisplayAddress(selectedProperty)}</div>
                  <div><span className="font-medium">Property:</span> {selectedProperty.property_address}</div>
                  {selectedProperty.refined_address && selectedProperty.refined_address !== selectedProperty.property_address && (
                    <div><span className="font-medium">Refined:</span> {selectedProperty.refined_address}</div>
                  )}
                  {selectedProperty.candidate_address && (
                    <div><span className="font-medium">Candidate:</span> {selectedProperty.candidate_address}</div>
                  )}
                  {selectedProperty.raw_property_address && (
                    <div><span className="font-medium">Raw:</span> {selectedProperty.raw_property_address}</div>
                  )}
                </div>
              </div>

              {/* Price and Confidence */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProperty.asking_price && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Asking Price</div>
                    <div className="text-2xl font-semibold text-[#3f4f24]">
                      {formatPrice(selectedProperty.asking_price)}
                    </div>
                  </div>
                )}
                {selectedProperty.confidence && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Confidence</div>
                    <Badge className={`${getConfidenceColor(selectedProperty.confidence)} border`}>
                      {(selectedProperty.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                )}
              </div>

              {/* Email Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-[#3f4f24] mb-3">Email Details</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">From:</span> {selectedProperty.from}</div>
                  {selectedProperty.sender_email && (
                    <div><span className="font-medium">Email:</span> {selectedProperty.sender_email}</div>
                  )}
                  {selectedProperty.sender_company && (
                    <div><span className="font-medium">Company:</span> {selectedProperty.sender_company}</div>
                  )}
                  <div><span className="font-medium">Subject:</span> {selectedProperty.subject}</div>
                  {selectedProperty.email_date && (
                    <div><span className="font-medium">Date:</span> {new Date(selectedProperty.email_date).toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Classification Reasons */}
              {selectedProperty.classification_reasons && selectedProperty.classification_reasons.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-[#3f4f24] mb-3">Classification Reasons</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.classification_reasons.map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {reason.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 font-mono space-y-1">
                <div>UID: {selectedProperty.email_uid}</div>
                {selectedProperty.email_file && <div>File: {selectedProperty.email_file}</div>}
                {selectedProperty.createdAt && (
                  <div>Extracted: {new Date(selectedProperty.createdAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyExtractions;