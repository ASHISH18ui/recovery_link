"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Building2,
  FileSpreadsheet,
  Users,
  Plus,
  Save,
  CheckCircle2,
  Pill,
  Clock,
  ShieldCheck,
  Stethoscope,
  Mail,
  UserPlus
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, Hospital, CarePlanTemplate, User } from "@/lib/api";

export default function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [templates, setTemplates] = useState<CarePlanTemplate[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Hospital edit state
  const [hName, setHName] = useState("");
  const [hAddress, setHAddress] = useState("");
  const [hPhone, setHPhone] = useState("");
  const [savingHospital, setSavingHospital] = useState(false);

  // New Template Modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tCategory, setTCategory] = useState("Orthopedics");
  const [tDuration, setTDuration] = useState(14);
  const [tInstructions, setTInstructions] = useState("");
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  // New Team Member Modal
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [memName, setMemName] = useState("");
  const [memEmail, setMemEmail] = useState("");
  const [memRole, setMemRole] = useState("nurse");
  const [memDept, setMemDept] = useState("Post-Surgical Monitoring");
  const [memPass, setMemPass] = useState("nurse123");
  const [submittingTeam, setSubmittingTeam] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [hData, tmplData, teamData] = await Promise.all([
        api.getHospitalProfile(),
        api.getTemplates(),
        api.getTeamMembers(),
      ]);
      setHospital(hData);
      setHName(hData.name);
      setHAddress(hData.address || "");
      setHPhone(hData.phone || "");

      setTemplates(tmplData);
      setTeam(teamData);
    } catch (err: any) {
      toast.error("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHospital(true);
    try {
      const updated = await api.updateHospitalProfile({
        name: hName,
        address: hAddress,
        phone: hPhone,
      });
      setHospital(updated);
      toast.success("Hospital profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update hospital");
    } finally {
      setSavingHospital(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSubmittingTemplate(true);
    try {
      const created = await api.createTemplate({
        name: tName.trim(),
        category: tCategory,
        duration_days: Number(tDuration),
        default_instructions: tInstructions,
        suggested_medications: JSON.stringify([]),
      });
      setTemplates((prev) => [...prev, created]);
      setTemplateModalOpen(false);
      setTName("");
      setTInstructions("");
      toast.success(`Care-plan template '${created.name}' created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create template");
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim() || !memEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSubmittingTeam(true);
    try {
      const added = await api.addTeamMember({
        full_name: memName.trim(),
        email: memEmail.trim(),
        role: memRole,
        department: memDept,
        password: memPass,
        hospital_id: hospital?.id || "",
      });
      setTeam((prev) => [...prev, added]);
      setTeamModalOpen(false);
      setMemName("");
      setMemEmail("");
      toast.success(`Invited ${added.full_name} (${added.role}) to staff portal`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add team member");
    } finally {
      setSubmittingTeam(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Hospital Profile", icon: <Building2 className="w-4 h-4" /> },
    { id: "templates", label: "Care-Plan Templates", badge: templates.length, icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "team", label: "Clinical Team Directory", badge: team.length, icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Settings className="w-6 h-6" />
            </div>
            <span>System Configuration & Protocols</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage hospital institutional settings, recovery pathways, and clinical staff roles
          </p>
        </div>

        {/* Tabs */}
        <Card className="p-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </Card>

        {/* TAB 1: HOSPITAL PROFILE */}
        {activeTab === "profile" && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Hospital Institutional Profile</CardTitle>
              <p className="text-xs text-slate-500">
                Institutional details reflected in patient notifications and regulatory audit logs
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveHospital} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Hospital / Medical Centre Name
                  </label>
                  <input
                    type="text"
                    required
                    value={hName}
                    onChange={(e) => setHName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Hospital Physical Address
                  </label>
                  <input
                    type="text"
                    value={hAddress}
                    onChange={(e) => setHAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    General Inquiries & Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={hPhone}
                    onChange={(e) => setHPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={savingHospital}
                    iconLeft={<Save className="w-4 h-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: CARE-PLAN TEMPLATES */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Hospital Care-Plan Templates
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-configured recovery protocols for common surgical procedures
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTemplateModalOpen(true)}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl) => (
                <Card key={tmpl.id} hoverLift>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                        {tmpl.category}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {tmpl.duration_days} Days
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {tmpl.name}
                    </h4>

                    {tmpl.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {tmpl.description}
                      </p>
                    )}

                    {tmpl.default_instructions && (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 italic border border-slate-200/60 dark:border-slate-700">
                        "{tmpl.default_instructions}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TEAM MEMBERS */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Clinical Care Team
                </h3>
                <p className="text-xs text-slate-500">
                  Authorized medical staff with dashboard access and role-based permissions
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTeamModalOpen(true)}
                iconLeft={<UserPlus className="w-4 h-4" />}
              >
                Invite Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((user) => (
                <Card key={user.id} hoverLift>
                  <CardContent className="p-5 flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-brand-gradient text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {user.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RoleBadge role={user.role} />
                        <span className="text-[11px] text-slate-400 truncate">
                          {user.department}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono pt-1 truncate">
                        {user.email}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title="Create Care-Plan Template"
        description="Add a standardized post-discharge monitoring pathway"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={submittingTemplate}
              onClick={handleCreateTemplate}
            >
              Save Template
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Protocol Name *
            </label>
            <input
              type="text"
              required
              value={tName}
              onChange={(e) => setTName(e.target.value)}
              placeholder="e.g. Anterior Hip Arthroplasty (THA)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={tCategory}
                onChange={(e) => setTCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Orthopedics">Orthopedics</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Obstetrics">Obstetrics</option>
                <option value="Spine">Spine</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Bariatrics">Bariatrics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Duration (Days)
              </label>
              <input
                type="number"
                value={tDuration}
                onChange={(e) => setTDuration(Number(e.target.value))}
                min={7}
                max={90}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Default Clinical Instructions
            </label>
            <textarea
              rows={3}
              value={tInstructions}
              onChange={(e) => setTInstructions(e.target.value)}
              placeholder="Guidance for wound care, mobilization, ice therapy, emergency symptoms..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>

      {/* Invite Team Member Modal */}
      <Modal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title="Invite Clinical Team Member"
        description="Add a physician, surgical nurse, or administrator to the monitoring portal"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setTeamModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={submittingTeam}
              onClick={handleAddMember}
            >
              Add Staff Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={memName}
              onChange={(e) => setMemName(e.target.value)}
              placeholder="e.g. Dr. Jennifer Wu, MD"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Institutional Email *
            </label>
            <input
              type="email"
              required
              value={memEmail}
              onChange={(e) => setMemEmail(e.target.value)}
              placeholder="staff@hospital.org"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Staff Role
              </label>
              <select
                value={memRole}
                onChange={(e) => setMemRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="doctor">Doctor / Physician</option>
                <option value="nurse">Nurse / Navigator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Password
              </label>
              <input
                type="password"
                required
                value={memPass}
                onChange={(e) => setMemPass(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <input
              type="text"
              value={memDept}
              onChange={(e) => setMemDept(e.target.value)}
              placeholder="e.g. Orthopedics, Cardiology, Post-Op Navigation"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

