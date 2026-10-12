import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  FolderTree, 
  BookOpen, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import JSZip from 'jszip';
import { PROJECT_FILES, ProjectFile } from '../data/sourceCodeFiles';

interface ProjectCodeViewProps {
  onBackToSettings?: () => void;
}

export const ProjectCodeView: React.FC<ProjectCodeViewProps> = ({ onBackToSettings }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'setup' | 'testing'>('files');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder('vehicle_parking_management');

      if (folder) {
        // Add core root files
        PROJECT_FILES.forEach(file => {
          folder.file(file.name, file.content);
        });

        // Add templates folder
        const templatesFolder = folder.folder('templates');
        if (templatesFolder) {
          templatesFolder.file('base.html', `<!-- Base Layout -->\n` + PROJECT_FILES.find(f => f.name === 'app.py')?.content);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vehicle_parking_management_college_project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label-mono">Deployment & Viva Assets</div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight mt-0.5">
            Python Flask Backend, Database & Windows Setup
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Complete production files, SQLite schema, and step-by-step Windows 10/11 execution guide
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToSettings && (
            <button
              onClick={onBackToSettings}
              className="border border-white/20 hover:border-white text-zinc-300 hover:text-white font-mono text-xs px-3.5 py-2 uppercase tracking-wider transition-colors"
            >
              ← SETTINGS
            </button>
          )}
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2 uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50"
          >
            <Download size={14} className="stroke-[3]" />
            <span>{isZipping ? 'PACKING ZIP...' : 'DOWNLOAD FULL ZIP (WIN10/11)'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 text-xs font-bold">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors uppercase tracking-wider ${
            activeTab === 'files'
              ? 'border-[#10b981] text-[#10b981] bg-white/5'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <FileCode size={15} />
          <span>SOURCE CODE INSPECTOR ({PROJECT_FILES.length} FILES)</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors uppercase tracking-wider ${
            activeTab === 'setup'
              ? 'border-[#10b981] text-[#10b981] bg-white/5'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Terminal size={15} />
          <span>WINDOWS STEP-BY-STEP SETUP</span>
        </button>

        <button
          onClick={() => setActiveTab('testing')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors uppercase tracking-wider ${
            activeTab === 'testing'
              ? 'border-[#10b981] text-[#10b981] bg-white/5'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen size={15} />
          <span>COLLEGE VIVA CHECKLIST</span>
        </button>
      </div>

      {/* Tab 1: Source Code Inspector */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer Tree */}
          <div className="border border-white/10 bg-[#0c0c0e] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <FolderTree size={14} className="text-[#10b981]" />
                <span className="uppercase tracking-wider">PROJECT FILE TREE</span>
              </span>
            </div>

            <div className="space-y-1">
              {PROJECT_FILES.map(file => {
                const isSelected = selectedFile.name === file.name;
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-[#10b981] text-[#0c0c0e] font-bold'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{file.name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.2 ${
                      isSelected ? 'bg-black/20 text-[#0c0c0e]' : 'bg-white/10 text-zinc-400'
                    }`}>
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-3 bg-[#0c0c0e] text-zinc-200 border border-white/10 flex flex-col overflow-hidden">
            {/* Code Header */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#10b981]">{selectedFile.path}</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{selectedFile.description}</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 transition-colors border border-white/20 uppercase tracking-wider font-bold"
              >
                {copied ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
                <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="p-4 overflow-x-auto max-h-[560px] overflow-y-auto bg-black/40">
              <pre className="font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Windows Setup Guide */}
      {activeTab === 'setup' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="border border-white/10 bg-[#0c0c0e] p-6 space-y-6">
            <div>
              <div className="label-mono">Windows Environment Setup</div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider mt-0.5">
                How to Run this Project Locally on a Windows Computer
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Follow these exact steps to run the Python Flask application and SQLite database on Windows 10 or Windows 11.
              </p>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-6 border-l-2 border-white/10 pl-5 ml-2">
              {/* Step 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#10b981] text-[#0c0c0e] text-[11px] font-bold flex items-center justify-center -ml-7.5">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">Install Python on Windows</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Download Python 3.10+ from <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer" className="text-[#10b981] underline">python.org</a>. Run the installer and <strong className="text-white">check the box "Add Python to PATH"</strong> before clicking Install Now.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#10b981] text-[#0c0c0e] text-[11px] font-bold flex items-center justify-center -ml-7.5">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">Open Folder in Visual Studio Code</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Extract the downloaded project ZIP, open VS Code, click <strong className="text-white">File → Open Folder</strong>, and select the <code className="bg-white/10 text-[#10b981] px-1.5 py-0.5">vehicle_parking_management</code> directory.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#10b981] text-[#0c0c0e] text-[11px] font-bold flex items-center justify-center -ml-7.5">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">Create & Activate Virtual Environment</h3>
                </div>
                <p className="text-xs text-zinc-300">
                  Open terminal in VS Code (Ctrl + `) and execute:
                </p>
                <div className="bg-black/60 border border-white/10 text-[#10b981] p-3 font-mono text-xs space-y-1">
                  <div>python -m venv venv</div>
                  <div className="text-zinc-500"># On Windows Command Prompt (cmd.exe):</div>
                  <div>venv\Scripts\activate</div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#10b981] text-[#0c0c0e] text-[11px] font-bold flex items-center justify-center -ml-7.5">
                    4
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">Install Dependencies</h3>
                </div>
                <div className="bg-black/60 border border-white/10 text-[#10b981] p-3 font-mono text-xs">
                  pip install -r requirements.txt
                </div>
              </div>

              {/* Step 5 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#10b981] text-[#0c0c0e] text-[11px] font-bold flex items-center justify-center -ml-7.5">
                    5
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">Initialize the SQLite Database</h3>
                </div>
                <p className="text-xs text-zinc-300">
                  Execute this one-liner to create <code className="bg-white/10 text-[#10b981] px-1.5 py-0.5">instance/parking.db</code> and seed 40 slots and default tariffs:
                </p>
                <div className="bg-black/60 border border-white/10 text-[#10b981] p-3 font-mono text-xs">
                  python -c "import database; database.init_db(); print('Database Ready!')"
                </div>
              </div>

              {/* Step 6 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#10b981] text-[#0c0c0e] text-[11px] font-bold flex items-center justify-center -ml-7.5">
                    6
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase">Launch Flask Server</h3>
                </div>
                <div className="bg-black/60 border border-white/10 text-[#10b981] p-3 font-mono text-xs">
                  python app.py
                </div>
                <p className="text-xs text-zinc-300 mt-2">
                  Open your browser and navigate to: <strong className="font-mono text-[#10b981]">http://127.0.0.1:5000</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Common Windows Errors */}
          <div className="border border-white/10 bg-[#0c0c0e] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <HelpCircle size={16} className="text-amber-400" />
              <span>Troubleshooting Common Windows Errors</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white/5 border border-white/10">
                <strong className="text-amber-400 block mb-1">
                  1. 'python' is not recognized as an internal or external command
                </strong>
                <p className="text-zinc-400">
                  Python was installed without adding to PATH. Re-run the python installer, select "Modify", and check "Add Python to environment variables".
                </p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10">
                <strong className="text-amber-400 block mb-1">
                  2. PowerShell execution policy error (activate.ps1 cannot be loaded)
                </strong>
                <p className="text-zinc-400">
                  Switch the VS Code terminal from PowerShell to Command Prompt (<code className="font-mono text-[#10b981]">cmd.exe</code>), or run <code className="font-mono text-[#10b981]">Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code> in PowerShell.
                </p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10">
                <strong className="text-amber-400 block mb-1">
                  3. Address already in use: Port 5000
                </strong>
                <p className="text-zinc-400">
                  Another app is using port 5000. Open <code className="font-mono text-[#10b981]">app.py</code> and change the bottom line to <code className="font-mono text-[#10b981]">app.run(port=5001)</code>, then visit <code className="font-mono text-[#10b981]">http://127.0.0.1:5001</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Evaluation Checklist */}
      {activeTab === 'testing' && (
        <div className="border border-white/10 bg-[#0c0c0e] p-6 space-y-5 max-w-4xl mx-auto">
          <div>
            <div className="label-mono">College Viva Protocol</div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mt-0.5">
              Evaluation & Testing Demonstration Checklist
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Follow this step-by-step checklist during project presentation to demonstrate all core features
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                title: '1. Successful Vehicle Entry',
                desc: 'Enter plate KA-01-AB-1234, vehicle type Car, owner name, and phone. Observe automatic bay assignment (C-01) and entry time generation.',
              },
              {
                title: '2. Duplicate Registration Prevention',
                desc: 'Attempt to register KA-01-AB-1234 again while it is still parked. Verify the system prevents duplicate entry with an error alert.',
              },
              {
                title: '3. Parking Slot Allocation & Status Change',
                desc: 'Navigate to "Slots". Verify that slot C-01 is marked Occupied, and the total available counter has decremented.',
              },
              {
                title: '4. Lot Full Handling',
                desc: 'Observe the slot dropdown and warning message if all bays in a specific vehicle category become full.',
              },
              {
                title: '5. Vehicle Exit & Hourly Fee Calculation',
                desc: 'In "Exit & Fee", search KA-01-AB-1234. Review the elapsed time, billable hours (rounded up to next full hour), tariff ($5.00/hr), and total charge.',
              },
              {
                title: '6. Receipt Generation & Thermal Print',
                desc: 'Confirm checkout. Verify the official printable receipt renders with ticket number, timestamps, and print dialog trigger.',
              },
              {
                title: '7. Search, Filtering & CSV Spreadsheet Export',
                desc: 'In "History", search by plate or driver, filter by active/completed status, and click "Export CSV" to open the log in Microsoft Excel.',
              },
              {
                title: '8. Data Persistence across Restarts',
                desc: 'Stop the application, refresh the page, and confirm all records and occupied slots persist reliably in SQLite database.',
              },
              {
                title: '9. Auto-Alert Notification (>90% Occupancy)',
                desc: 'When total occupancy reaches or exceeds 90% (e.g. 37 of 40 bays), verify that a high-priority warning banner automatically displays in the Dashboard with slot counts and action links.',
              },
            ].map(item => (
              <div key={item.title} className="p-3.5 border border-white/10 bg-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Check size={14} className="text-[#10b981]" />
                  <span className="uppercase">{item.title}</span>
                </div>
                <p className="text-zinc-400 pl-5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
