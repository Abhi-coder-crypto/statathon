# SafeData Pipeline - MERN Stack Rebuild Prompt

**Build a professional, enterprise-grade Data Privacy Protection and Anonymization System called "SafeData Pipeline" using the MERN stack (MongoDB, Express.js, React, Node.js) with TypeScript. The application should have a CRM-style professional UI with a blue and white color theme (use different colors for graphs and charts).**

---

## TECHNOLOGY STACK

- **Frontend**: React 18+ with TypeScript, Vite, TailwindCSS
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Charts**: Recharts or Chart.js (use varied colors: teal, orange, purple, green for different data visualizations)
- **File Processing**: Papa Parse (CSV), xlsx (Excel), multer (file uploads)
- **PDF Generation**: PDFKit or jsPDF
- **Authentication**: JWT with bcrypt
- **State Management**: React Query + Zustand

---

## COLOR THEME

- **Primary**: Blue (#2563EB, #3B82F6, #1E40AF)
- **Secondary**: White (#FFFFFF, #F8FAFC, #F1F5F9)
- **Accents**: Slate gray (#64748B, #94A3B8)
- **Graph Colors**: Teal (#14B8A6), Orange (#F97316), Purple (#8B5CF6), Green (#22C55E), Amber (#F59E0B), Rose (#F43F5E)
- **Status**: Success (#10B981), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6)

---

## CORE FEATURES TO IMPLEMENT

### 1. Authentication System
- Login/Register with JWT tokens
- User roles: Administrator, Data Analyst, Privacy Officer
- Password hashing with bcrypt
- Session management with refresh tokens
- Default credentials: admin / admin@123

### 2. User Profile Dashboard
- Editable personal information (name, email, department, role)
- Account settings (2FA toggle, session timeout, notifications)
- Permissions display (data_upload, risk_assessment, privacy_enhancement, utility_measurement, report_generation, system_config)
- Activity statistics with line charts (files processed, risk assessments, reports generated over 30 days)
- System status indicators (server, database, security)

### 3. CRM-Style Dashboard Layout
- Left sidebar navigation with icons
- Top header with user avatar, notifications, logout
- Breadcrumb navigation
- Collapsible sidebar
- Responsive design

### 4. Data Upload & Management Module
- Drag-and-drop file upload
- Support formats: CSV, XLSX, XLS, JSON, XML, TSV, Parquet
- Automatic encoding detection
- Data preview table with pagination, sorting, filtering
- **Data Quality Assessment**:
  - Completeness score (% non-null values)
  - Consistency score (type consistency)
  - Validity score (range/format validity)
  - Issues list with recommendations
- **Automatic Data Repair**:
  - Fill missing values (median for numeric, mode for categorical)
  - Convert numeric strings to numbers
  - Standardize text (trim, title case)
  - Remove duplicates
  - Handle outliers (IQR capping)

### 5. Risk Assessment Module
- Configure quasi-identifiers (multi-select from columns)
- Configure sensitive attributes
- Set K-anonymity threshold (slider 2-20)
- Sample size percentage (slider 10%-100%)
- Attack scenarios selection (Prosecutor, Journalist, Marketer)
- **Calculate**:
  - Equivalence classes (group by quasi-identifiers)
  - K-anonymity violations count
  - Unique records count (highest risk)
  - Overall re-identification risk score (0-1)
  - Risk level classification (Low/Medium/High)
  - Attack-specific risk scores
  - Population uniqueness estimation
  - Sensitive attribute disclosure/homogeneity risks
- **Visualizations**:
  - Equivalence class size histogram
  - Risk level pie chart
  - K-anonymity compliance bar chart
  - Attack scenario risks bar chart
- Generate recommendations based on results

### 6. Privacy Enhancement Module
Implement these anonymization techniques:

**A. K-Anonymity**
- Methods: Global Recoding, Local Recoding, Clustering-based
- Parameters: k-value, suppression limit (0-20%)
- Generalize numeric columns into ranges
- Generalize categorical columns (replace rare values with "*")
- Suppress records that still violate

**B. L-Diversity**
- Methods: Distinct, Entropy, Recursive
- Parameters: l-value, sensitive attribute
- Ensure l distinct sensitive values per equivalence class

**C. T-Closeness**
- Distance measures: Earth Mover's Distance (EMD)
- Parameters: t-value (0-1), sensitive attribute
- Ensure sensitive attribute distribution matches global distribution

**D. Differential Privacy**
- Mechanisms: Laplace, Gaussian
- Parameters: epsilon (0.1-10), sensitivity
- Add calibrated noise to numeric columns

**E. Synthetic Data Generation**
- Methods: Statistical, Copula-based
- Parameters: sample size (50%-200%), preserve correlations, preserve distributions
- Generate synthetic records matching statistical properties

### 7. Utility Measurement Module
Compare original vs processed data:

- **Statistical Similarity**: Mean, std, range preservation per column
- **Correlation Preservation**: Compare correlation matrices
- **Distribution Similarity**: Kolmogorov-Smirnov test, Wasserstein distance
- **Information Loss**: Entropy-based, mutual information loss
- **Classification Utility**: Train Random Forest, compare accuracy
- **Query Accuracy**: Count, sum, mean preservation
- Overall utility score (0-1) with level (Excellent/Good/Fair/Poor)
- Side-by-side comparison visualizations
- Recommendations for improving utility

### 8. Report Generation Module
Generate comprehensive reports:

**Report Types**:
- Executive Summary (brief overview)
- Technical Report (detailed metrics)
- Comprehensive Report (full analysis)

**Report Formats**:
- PDF (downloadable)
- HTML (viewable/printable)

**Report Sections**:
- Title page with organization, date, author
- Executive summary with key metrics
- Privacy assessment (risk score, violations, unique records)
- Utility assessment (similarity scores, preservation rates)
- Detailed analysis with charts
- Recommendations section
- Compliance notes

### 9. Configuration Management
Pre-built privacy profiles:
- Low Privacy / High Utility (k=2, l=2, t=0.8, epsilon=5.0)
- Medium Privacy / Balanced (k=5, l=3, t=0.5, epsilon=2.0)
- High Privacy / Secure (k=10, l=5, t=0.2, epsilon=0.5)
- Healthcare Specialized
- Financial Regulatory
- Education Research
- Public Statistics
- Law Enforcement
- Synthetic Data Generation

Each profile includes: name, description, parameters, use case, recommended_for list, government_clearance level

### 10. Encryption & Security Utilities
- AES-256 encryption for sensitive data
- Password-based key derivation
- Data hashing (SHA-256)
- Encrypted data export/backup
- Secure session management

### 11. File Operations
- Export processed data: CSV, XLSX, JSON
- Save/load configurations
- Data backup with timestamps
- Audit logging

---

## CRM-STYLE UI COMPONENTS

1. **Sidebar Navigation**
   - Dashboard
   - Data Upload
   - Risk Assessment
   - Privacy Enhancement
   - Utility Measurement
   - Reports
   - Configuration
   - User Profile
   - Help & Documentation

2. **Dashboard Cards**
   - Total datasets processed
   - Risk assessments completed
   - Reports generated
   - System uptime
   - Quick action buttons

3. **Data Tables**
   - Sortable columns
   - Pagination
   - Row selection
   - Export button
   - Search/filter

4. **Form Elements**
   - Multi-select dropdowns for columns
   - Sliders with value display
   - Toggle switches
   - Radio button groups
   - File dropzone

5. **Charts**
   - Line charts (activity trends)
   - Bar charts (comparisons)
   - Pie/Donut charts (distributions)
   - Histograms (frequency)
   - Heatmaps (correlations)

6. **Status Indicators**
   - Progress bars
   - Loading spinners
   - Success/error toasts
   - Badge indicators

---

## API ENDPOINTS STRUCTURE

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/password

POST   /api/data/upload
GET    /api/data/:id
GET    /api/data/:id/preview
POST   /api/data/:id/quality-check
POST   /api/data/:id/repair

POST   /api/risk/assess
GET    /api/risk/:assessmentId
GET    /api/risk/:assessmentId/visualization

POST   /api/privacy/k-anonymity
POST   /api/privacy/l-diversity
POST   /api/privacy/t-closeness
POST   /api/privacy/differential-privacy
POST   /api/privacy/synthetic-data

POST   /api/utility/measure
GET    /api/utility/:measurementId

POST   /api/reports/generate
GET    /api/reports/:reportId
GET    /api/reports/:reportId/download

GET    /api/config/profiles
POST   /api/config/profiles
GET    /api/config/profiles/:id
```

---

## DATABASE SCHEMA (MongoDB)

```typescript
// User
{
  email: string,
  password: string (hashed),
  fullName: string,
  role: 'admin' | 'analyst' | 'officer',
  department: string,
  permissions: string[],
  createdAt: Date,
  lastLogin: Date
}

// Dataset
{
  userId: ObjectId,
  filename: string,
  originalName: string,
  format: string,
  size: number,
  columns: string[],
  rowCount: number,
  qualityScore: number,
  uploadedAt: Date
}

// RiskAssessment
{
  datasetId: ObjectId,
  userId: ObjectId,
  quasiIdentifiers: string[],
  sensitiveAttributes: string[],
  kThreshold: number,
  overallRisk: number,
  riskLevel: string,
  violations: number,
  uniqueRecords: number,
  recommendations: string[],
  createdAt: Date
}

// PrivacyOperation
{
  datasetId: ObjectId,
  technique: string,
  parameters: object,
  processedDataPath: string,
  createdAt: Date
}

// UtilityMeasurement
{
  originalDatasetId: ObjectId,
  processedDatasetId: ObjectId,
  overallUtility: number,
  utilityLevel: string,
  metrics: object,
  createdAt: Date
}

// Report
{
  userId: ObjectId,
  type: string,
  format: string,
  filePath: string,
  createdAt: Date
}

// Configuration
{
  name: string,
  description: string,
  parameters: object,
  useCase: string,
  governmentClearance: string
}
```

---

## BRANDING

- **Organization**: Government of India
- **Department**: Ministry of Electronics and Information Technology
- **Application Name**: SafeData Pipeline
- **Tagline**: Data Privacy Protection & Anonymization System
- **Developer Credit**: AIRAVATA Technologies

---

## ADDITIONAL REQUIREMENTS

1. Responsive design (desktop, tablet, mobile)
2. Dark mode support (optional toggle)
3. Accessibility compliance (ARIA labels)
4. Loading states for all async operations
5. Error boundaries and fallback UI
6. Form validation with error messages
7. Confirmation dialogs for destructive actions
8. Keyboard navigation support
9. Toast notifications for actions
10. Session timeout warning

---

**This prompt provides everything needed to rebuild SafeData Pipeline as a modern, professional MERN stack application with TypeScript and a CRM-style interface.**
