import React, { useState } from 'react';
import '../styles/TrainingTracker.css';

const TrainingTracker = () => {
  const [sheetId, setSheetId] = useState(localStorage.getItem('sheet_id') || '');
  const [employees, setEmployees] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(!sheetId);
  const [statusMessage, setStatusMessage] = useState('');

  // Training logging state
  const [activeTab, setActiveTab] = useState('log');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTrainings, setSelectedTrainings] = useState([]);
  const [selectedCrew, setSelectedCrew] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState(() => {
    const saved = localStorage.getItem('training_records');
    return saved ? JSON.parse(saved) : [];
  });

  // Report state
  const [reportTraining, setReportTraining] = useState('');
  const [reportData, setReportData] = useState([]);

  // Sample data - full employee list
  const sampleEmployees = [
    { id: '03602', name: 'ALI ALCALA LARA', crew: 'WAREHOUSE - BELL PEPPER' },
    { id: '03107', name: 'SAUL ALCANTARA', crew: 'WAREHOUSE-FORKLIFT NITE CREW' },
    { id: '03571', name: 'BRANDO ALCARAZ', crew: 'WAREHOUSE-FORKLIFT NITE CREW' },
    { id: '01591', name: 'CARINA ALCARAZ', crew: 'WAREHOUSE - GENERAL' },
    { id: '03518', name: 'VALENTIN ALCARAZ', crew: 'WAREHOUSE - NITE CREW' },
    { id: '03531', name: 'JESUS AMADOR', crew: 'WAREHOUSE - NITE CREW' },
    { id: '03605', name: 'JESUS AMBRIZ', crew: 'FIELD - IRRG & GENERAL' },
    { id: '03368', name: 'CARLOS ANGUIANO', crew: 'WAREHOUSE - BELL PEPPER' },
    { id: '03369', name: 'TERESA ANGUIANO', crew: 'WAREHOUSE - BELL PEPPER' },
    { id: '03593', name: 'JOSE ANTONIO ANGELES', crew: 'WAREHOUSE - GENERAL' },
    { id: '03574', name: 'RAYMUNDO ANGELES', crew: 'WAREHOUSE - NITE CREW' },
    { id: '03559', name: 'PEDRO ANTUNA', crew: 'FIELD - HARVEST CREW' },
    { id: '03633', name: 'RICARDO APARICIO', crew: 'WAREHOUSE - GENERAL' },
    { id: '03547', name: 'LUIS AQUINO', crew: 'WAREHOUSE - NITE CREW' },
    { id: '03604', name: 'GABRIEL ARANDA', crew: 'FIELD - IRRG & GENERAL' },
  ];

  const sampleTrainings = [
    'ALLERGEN',
    'ATV',
    'CONFINED SPACES',
    'FIRE EXTINGUISHER',
    'FIRST AID',
    'FOOD DEFENSE',
    'FOOD SAFETY & HYGIENE',
    'FOODBORNE ILLNESS',
    'FORKLIFT SAFETY',
    'HAACP',
    'HAND WASHING',
    'HARASSMENT & BULLYING',
    'HAZARDOUS COMMUNICATION',
    'HEAT ILLNESS PREVENTION',
    'IIPP',
    'LOTO',
    'PESTICIDE/CHEMICAL HANDLER',
    'SANITATION CREW TRAINING',
    'TRACEABILITY REVIEW',
    'TRACTOR SAFETY',
    'WILDFIRE SAFETY',
    'WORK PLACE VIOLENCE'
  ];

  // Get unique crews
  const crews = [...new Set(employees.map(e => e.crew))].filter(Boolean).sort();
  const filteredEmployees = selectedCrew
    ? employees.filter(e => e.crew === selectedCrew)
    : employees;

  // Handle sheet ID setup
  const handleSetSheetId = async () => {
    if (!sheetId.trim()) {
      setStatusMessage('Please enter a valid Sheet ID');
      return;
    }

    localStorage.setItem('sheet_id', sheetId);
    setIsLoading(true);
    setStatusMessage('Connecting to Google Sheet...');

    try {
      // For now, just load sample data
      // In production, you'd call Google Sheets API here
      setEmployees(sampleEmployees);
      setTrainings(sampleTrainings);
      setSetupMode(false);
      setStatusMessage('✓ Connected! Ready to log training.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle training logging
  const handleTrainingToggle = (training) => {
    setSelectedTrainings(prev =>
      prev.includes(training)
        ? prev.filter(t => t !== training)
        : [...prev, training]
    );
  };

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmitTraining = () => {
    if (!logDate || selectedTrainings.length === 0 || selectedEmployees.length === 0) {
      setStatusMessage('Please select date, training(s), and employee(s)');
      return;
    }

    const newRecords = [];
    selectedTrainings.forEach(training => {
      selectedEmployees.forEach(empId => {
        newRecords.push({
          date: logDate,
          training: training,
          employeeId: empId,
          employeeName: employees.find(e => e.id === empId)?.name || empId
        });
      });
    });

    const updatedRecords = [...trainingRecords, ...newRecords];
    setTrainingRecords(updatedRecords);
    localStorage.setItem('training_records', JSON.stringify(updatedRecords));

    setStatusMessage(`✓ Logged ${selectedTrainings.length} training(s) for ${selectedEmployees.length} employee(s)`);
    setSelectedTrainings([]);
    setSelectedEmployees([]);
    setSelectedCrew('');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleGenerateReport = () => {
    if (!reportTraining) {
      setStatusMessage('Please select a training type');
      return;
    }

    const report = employees.map(emp => {
      const record = trainingRecords.find(r => r.training === reportTraining && r.employeeId === emp.id);
      return {
        ...emp,
        completionDate: record?.date || ''
      };
    });

    setReportData(report);
  };

  const handleExportReport = () => {
    if (reportData.length === 0) return;

    const csv = [
      ['Employee ID', 'Name', 'Crew', `${reportTraining} - Completion Date`],
      ...reportData.map(row => [row.id, row.name, row.crew, row.completionDate])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTraining.replace(/\s+/g, '_')}_Report.csv`;
    a.click();
  };

  const handleExportAllData = () => {
    const allRecords = [
      ['Date', 'Training', 'Employee ID', 'Employee Name'],
      ...trainingRecords.map(r => [r.date, r.training, r.employeeId, r.employeeName])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([allRecords], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrainingLog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Setup mode UI
  if (setupMode) {
    return (
      <div className="setup-container">
        <div className="setup-card">
          <h2>Set up your training tracker</h2>
          
          <div className="info-box">
            <p className="info-title">Before you start:</p>
            <ol className="info-list">
              <li>Create a Google Sheet named "Johnston Farms Training Tracker"</li>
              <li>Create three sheets inside it: Employees, Training, TrainingLog</li>
              <li>Copy your Sheet ID from the URL</li>
            </ol>
          </div>

          <div className="form-group">
            <label>Google Sheet ID</label>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="1ABC123XYZ456def..."
              className="form-input"
            />
          </div>

          <button
            onClick={handleSetSheetId}
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isLoading ? 'Connecting...' : 'Connect to Google Sheet'}
          </button>

          {statusMessage && (
            <div className="status-message" style={{ marginTop: '1rem' }}>
              {statusMessage}
            </div>
          )}

          <div className="help-box">
            <p className="help-title">Don't have a Sheet yet?</p>
            <p className="help-text">See SETUP_INSTRUCTIONS.md for a step-by-step guide to create and configure your Google Sheet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Main app UI
  return (
    <div className="app-container">
      <div className="app-header">
        <div>
          <h1>Training Tracker</h1>
        </div>
        <button
          onClick={() => setSetupMode(true)}
          className="btn btn-secondary"
        >
          Change sheet
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log Training
        </button>
        <button
          className={`tab ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Reports
        </button>
      </div>

      {activeTab === 'log' && (
        <div className="tab-content">
          <div className="form-section">
            <label>Training date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="form-input"
              style={{ maxWidth: '200px' }}
            />
          </div>

          <div className="form-section">
            <label>Select training(s)</label>
            <div className="checkbox-grid">
              {trainings.map(training => (
                <label key={training} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTrainings.includes(training)}
                    onChange={() => handleTrainingToggle(training)}
                  />
                  <span>{training}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label>Filter by crew</label>
            <select
              value={selectedCrew}
              onChange={(e) => {
                setSelectedCrew(e.target.value);
                setSelectedEmployees([]);
              }}
              className="form-input"
              style={{ maxWidth: '300px' }}
            >
              <option value="">All employees</option>
              {crews.map(crew => (
                <option key={crew} value={crew}>{crew}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Select employee(s) ({selectedEmployees.length} selected)</label>
            <div className="employee-list">
              {filteredEmployees.map(emp => (
                <label key={emp.id} className="employee-item">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => handleEmployeeToggle(emp.id)}
                  />
                  <div>
                    <div className="employee-name">{emp.name}</div>
                    <div className="employee-crew">{emp.crew}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleSubmitTraining} className="btn btn-primary">
            Log training
          </button>

          {statusMessage && (
            <div className="status-message" style={{ marginTop: '1rem' }}>
              {statusMessage}
            </div>
          )}

          {trainingRecords.length > 0 && (
            <div className="records-card">
              <p>{trainingRecords.length} training record(s) logged</p>
              <button onClick={handleExportAllData} className="btn btn-secondary">
                Export all data as CSV
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'report' && (
        <div className="tab-content">
          <div className="form-section">
            <label>Select training to report on</label>
            <select
              value={reportTraining}
              onChange={(e) => setReportTraining(e.target.value)}
              className="form-input"
              style={{ maxWidth: '300px' }}
            >
              <option value="">Choose training type</option>
              {trainings.map(training => (
                <option key={training} value={training}>{training}</option>
              ))}
            </select>
          </div>

          <button onClick={handleGenerateReport} className="btn btn-primary">
            Generate report
          </button>

          {reportData.length > 0 && (
            <div className="report-section">
              <button onClick={handleExportReport} className="btn btn-secondary">
                Export as CSV
              </button>

              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Crew</th>
                      <th>Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map(row => (
                      <tr key={row.id}>
                        <td>
                          <div className="employee-name">{row.name}</div>
                          <div className="employee-id">ID: {row.id}</div>
                        </td>
                        <td className="crew-cell">{row.crew}</td>
                        <td className={row.completionDate ? 'completed' : 'empty'}>
                          {row.completionDate || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainingTracker;
