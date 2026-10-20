import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  X,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Edit3,
  Sparkles,
  Layers,
} from "lucide-react";
import { ClientRecord, AccessSession } from "../types";
import { soundManager } from "../utils/soundEffects";
import {
  getClientsFromDatabase,
  saveClientToDatabase,
  deleteClientFromDatabase,
  setClientDays,
  addClientDays,
  setClientExpirationDate,
  toggleClientStatus,
  MASTER_ADMIN_EMAIL,
} from "../services/clientStorage";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLoginDirect: (session: AccessSession) => void;
  onLogout?: () => void;
}

const ADMIN_EMAIL = MASTER_ADMIN_EMAIL;

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onAdminLoginDirect,
  onLogout,
}) => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "EXPIRED" | "BLOCKED" | "LIFETIME"
  >("ALL");
  const [authKey, setAuthKey] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // New Client Form
  const [newEmail, setNewEmail] = useState<string>("");
  const [durationOption, setDurationOption] = useState<string>("30"); // days, 'custom' or 'lifetime'
  const [customDays, setCustomDays] = useState<string>("30");
  const [newNotes, setNewNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dedicated Member Days Management Modal
  const [managingClient, setManagingClient] = useState<ClientRecord | null>(null);
  const [inputExactDays, setInputExactDays] = useState<string>("30");
  const [inputCalendarDate, setInputCalendarDate] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Auto-authenticate if stored or if current session is admin
      const savedAdmin = localStorage.getItem("candlex_admin_authenticated");
      let isAdminSession = false;
      try {
        const session = localStorage.getItem("candlex_access_session");
        if (session) {
          const parsed = JSON.parse(session);
          if (
            parsed?.isAdmin ||
            parsed?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
          ) {
            isAdminSession = true;
          }
        }
      } catch {}

      if (savedAdmin === "true" || isAdminSession) {
        setIsAuthenticated(true);
      }
      fetchClients();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getClientsFromDatabase();
      setClients(data);
    } catch (err) {
      console.error("Erro ao carregar clientes do Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = authKey.trim().toLowerCase();
    if (
      clean === ADMIN_EMAIL.toLowerCase() ||
      clean === "admin" ||
      clean === "herisson"
    ) {
      setIsAuthenticated(true);
      localStorage.setItem("candlex_admin_authenticated", "true");
      setErrorMessage("");
      fetchClients();
      soundManager.playGoalReached();
    } else {
      setErrorMessage("Chave ou e-mail de Administrador inválido.");
      soundManager.playLossChime();
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Por favor informe um e-mail válido.");
      return;
    }

    let expiresAt: number | null = null;
    if (durationOption === "lifetime") {
      expiresAt = null;
    } else if (durationOption === "custom") {
      const parsed = parseInt(customDays, 10);
      const days = isNaN(parsed) || parsed < 0 ? 30 : parsed;
      expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    } else {
      const days = parseInt(durationOption, 10) || 30;
      expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const updatedList = await saveClientToDatabase({
        email: cleanEmail,
        firstLoginAt: now,
        lastLoginAt: now,
        expiresAt,
        status: "ACTIVE",
        registeredVia: "ADMIN_MANUAL",
        notes: newNotes.trim() || "Cadastrado manualmente pelo Administrador",
      });

      setClients(updatedList);
      setNewEmail("");
      setNewNotes("");
      setDurationOption("30");
      setCustomDays("30");
      soundManager.playOrderExecuted();
    } catch (err) {
      console.error("Erro ao adicionar cliente no Supabase:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Days Operations
  const handleSetExactDays = async (email: string, days: number | null) => {
    try {
      const updatedList = await setClientDays(email, days);
      setClients(updatedList);
      soundManager.playOrderExecuted();

      // Update managingClient if currently open
      if (managingClient && managingClient.email.toLowerCase() === email.toLowerCase()) {
        const updated = updatedList.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        );
        if (updated) setManagingClient(updated);
      }
    } catch (err) {
      console.error("Erro ao definir dias:", err);
    }
  };

  const handleAddDaysToCurrent = async (email: string, daysToAdd: number) => {
    try {
      const updatedList = await addClientDays(email, daysToAdd);
      setClients(updatedList);
      soundManager.playOrderExecuted();

      if (managingClient && managingClient.email.toLowerCase() === email.toLowerCase()) {
        const updated = updatedList.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        );
        if (updated) setManagingClient(updated);
      }
    } catch (err) {
      console.error("Erro ao adicionar dias:", err);
    }
  };

  const handleSetCalendarDate = async (email: string) => {
    if (!inputCalendarDate) return;
    try {
      const parsedDate = new Date(`${inputCalendarDate}T23:59:59`);
      const timestamp = parsedDate.getTime();
      if (isNaN(timestamp)) {
        alert("Data inválida.");
        return;
      }
      const updatedList = await setClientExpirationDate(email, timestamp);
      setClients(updatedList);
      soundManager.playOrderExecuted();

      if (managingClient && managingClient.email.toLowerCase() === email.toLowerCase()) {
        const updated = updatedList.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        );
        if (updated) setManagingClient(updated);
      }
    } catch (err) {
      console.error("Erro ao definir data do calendário:", err);
    }
  };

  const handleSaveNotes = async (email: string) => {
    const target = clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (!target) return;
    try {
      const updatedList = await saveClientToDatabase({
        ...target,
        notes: editNotes.trim(),
      });
      setClients(updatedList);
      soundManager.playOrderExecuted();

      if (managingClient && managingClient.email.toLowerCase() === email.toLowerCase()) {
        const updated = updatedList.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        );
        if (updated) setManagingClient(updated);
      }
    } catch (err) {
      console.error("Erro ao salvar notas:", err);
    }
  };

  const handleToggleStatus = async (email: string) => {
    try {
      const updatedList = await toggleClientStatus(email);
      setClients(updatedList);
      soundManager.playOrderExecuted();

      if (managingClient && managingClient.email.toLowerCase() === email.toLowerCase()) {
        const updated = updatedList.find(
          (c) => c.email.toLowerCase() === email.toLowerCase()
        );
        if (updated) setManagingClient(updated);
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const handleDeleteClient = async (email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email}?`)) return;

    try {
      const updatedList = await deleteClientFromDatabase(email);
      setClients(updatedList);
      if (managingClient && managingClient.email.toLowerCase() === email.toLowerCase()) {
        setManagingClient(null);
      }
    } catch (err) {
      console.error("Erro ao excluir cliente no Supabase:", err);
    }
  };

  const handleDirectAdminLogin = () => {
    onClose();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("candlex_access_session");
    localStorage.removeItem("candlex_admin_authenticated");
    if (onLogout) onLogout();
    onClose();
  };

  // Open member days management modal
  const openDaysManager = (client: ClientRecord) => {
    setManagingClient(client);
    setEditNotes(client.notes || "");
    setInputExactDays("30");
    if (client.expiresAt) {
      const d = new Date(client.expiresAt);
      const isoDate = d.toISOString().split("T")[0];
      setInputCalendarDate(isoDate);
    } else {
      setInputCalendarDate("");
    }
  };

  // Filtering
  const now = Date.now();
  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.email
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    if (!matchesSearch) return false;

    const isExpired = c.expiresAt ? c.expiresAt <= now : false;
    const isLifetime = c.expiresAt === null;

    if (statusFilter === "ACTIVE") return c.status === "ACTIVE" && !isExpired;
    if (statusFilter === "EXPIRED") return isExpired || c.status === "EXPIRED";
    if (statusFilter === "BLOCKED") return c.status === "BLOCKED";
    if (statusFilter === "LIFETIME") return isLifetime;
    return true;
  });

  const totalClients = clients.length;
  const activeCount = clients.filter(
    (c) => c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt > now)
  ).length;
  const expiredCount = clients.filter(
    (c) => c.status === "EXPIRED" || (c.expiresAt && c.expiresAt <= now)
  ).length;
  const blockedCount = clients.filter((c) => c.status === "BLOCKED").length;
  const lifetimeCount = clients.filter((c) => c.expiresAt === null).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#090C12] border border-[#2A364F] rounded-3xl shadow-[0_0_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#1E2638] bg-[#0E131F] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A00]/25 to-amber-500/25 border border-[#FF7A00]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,0,0.3)]">
              <Key className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white tracking-wide">
                  PAINEL ADMINISTRATIVO CANDLEX AI
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  MASTER CONTROL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#161D2B] text-amber-300 border border-[#232F46]">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gerencie com precisão a quantidade de dias de cada membro da inteligência artificial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleDirectAdminLogin}
                  className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#FF8C00] to-[#FF7A00] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Abrir Terminal de Trading como Administrador"
                >
                  <span>Ir para Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  id="btn-admin-logout"
                  onClick={handleAdminLogout}
                  className="py-1.5 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Sair do CandleX IA e voltar para a tela de login"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair CandleX IA</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar Painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto w-full my-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#141A26] border border-[#2A364F] flex items-center justify-center mx-auto text-[#FF7A00]">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Autenticação do Administrador</h3>
              <p className="text-xs text-slate-400 mt-1">
                Insira o e-mail ou a chave mestre para liberar o painel completo de controle.
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-3 pt-2">
              <input
                type="text"
                autoFocus
                placeholder="digite: herisson.trader.jt5@gmail.com"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none font-mono text-center"
              />

              {errorMessage && (
                <div className="text-xs text-rose-400 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#FF7A00] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all cursor-pointer"
              >
                Acessar Painel Master
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div
                onClick={() => setStatusFilter("ALL")}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  statusFilter === "ALL"
                    ? "bg-[#141B29] border-[#FF7A00]/70 shadow-sm"
                    : "bg-[#0E131F] border-[#1E2638] hover:border-slate-600"
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Membros</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                  {totalClients}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("ACTIVE")}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  statusFilter === "ACTIVE"
                    ? "bg-[#0A2016] border-emerald-500 shadow-sm"
                    : "bg-[#0E131F] border-emerald-500/30 hover:border-emerald-500/60"
                }`}
              >
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Ativos</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {activeCount}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("EXPIRED")}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  statusFilter === "EXPIRED"
                    ? "bg-[#250F14] border-rose-500 shadow-sm"
                    : "bg-[#0E131F] border-rose-500/30 hover:border-rose-500/60"
                }`}
              >
                <div className="text-[10px] font-bold text-rose-400 uppercase">Expirados</div>
                <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5">
                  {expiredCount}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("BLOCKED")}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  statusFilter === "BLOCKED"
                    ? "bg-[#201016] border-purple-500 shadow-sm"
                    : "bg-[#0E131F] border-purple-500/30 hover:border-purple-500/60"
                }`}
              >
                <div className="text-[10px] font-bold text-purple-400 uppercase">Bloqueados</div>
                <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono mt-0.5">
                  {blockedCount}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("LIFETIME")}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  statusFilter === "LIFETIME"
                    ? "bg-[#261A0C] border-amber-500 shadow-sm"
                    : "bg-[#0E131F] border-amber-500/30 hover:border-amber-500/60"
                }`}
              >
                <div className="text-[10px] font-bold text-amber-400 uppercase">Vitalícios</div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5">
                  {lifetimeCount}
                </div>
              </div>
            </div>

            {/* Add New Member Box with Granular Days Selection */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Plus className="w-4 h-4 text-[#FF7A00]" />
                  <span>Cadastrar Novo Membro ou Renovar Dias Manualmente</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Definição livre de dias para a IA
                </span>
              </div>

              <form onSubmit={handleAddClient} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Email */}
                  <div className="sm:col-span-5">
                    <input
                      type="email"
                      required
                      placeholder="e-mail do membro (ex: aluno@gmail.com)..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                    />
                  </div>

                  {/* Mode / Days Preset */}
                  <div className={durationOption === "custom" ? "sm:col-span-4" : "sm:col-span-4"}>
                    <select
                      value={durationOption}
                      onChange={(e) => setDurationOption(e.target.value)}
                      className="w-full bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono cursor-pointer"
                    >
                      <option value="7">7 Dias (Teste Grátis)</option>
                      <option value="15">15 Dias (Quinzena)</option>
                      <option value="30">30 Dias (1 Mês - Padrão)</option>
                      <option value="60">60 Dias (2 Meses)</option>
                      <option value="90">90 Dias (3 Meses)</option>
                      <option value="180">180 Dias (6 Meses)</option>
                      <option value="365">365 Dias (1 Ano)</option>
                      <option value="lifetime">Vitalício (Sem Expiração)</option>
                      <option value="custom">★ Personalizado (Digitar Dias)...</option>
                    </select>
                  </div>

                  {/* Custom Days Input if Selected */}
                  {durationOption === "custom" && (
                    <div className="sm:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          required
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                          placeholder="Qtd dias..."
                          className="w-full bg-[#070A0F] border border-amber-500/70 focus:border-[#FF7A00] rounded-xl px-3 py-2.5 text-xs text-amber-300 font-mono font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                          dias
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className={durationOption === "custom" ? "sm:col-span-12" : "sm:col-span-3"}>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newEmail.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#FF7A00] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Liberar Membro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes Input */}
                <input
                  type="text"
                  placeholder="Observações opcionais (ex: 'Aluno Mentoria VIP', 'Plano 60 Dias Hiove', etc.)..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#070A0F] border border-[#182030] focus:border-[#FF7A00] rounded-xl px-3.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none font-sans"
                />
              </form>
            </div>

            {/* Member Search and Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="buscar por e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#070A0F] border border-[#1E2638] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Mostrando <strong className="text-white">{filteredClients.length}</strong> de{" "}
                    {totalClients} membros
                  </span>

                  <button
                    type="button"
                    onClick={fetchClients}
                    className="p-2 rounded-xl bg-[#141A26] border border-[#1E2638] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Atualizar Lista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-[#1E2638] rounded-2xl overflow-hidden bg-[#070A0F] shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0E131F] text-slate-400 font-mono text-[10px] uppercase border-b border-[#1E2638]">
                      <tr>
                        <th className="py-3 px-4">Membro / E-mail</th>
                        <th className="py-3 px-3">Origem</th>
                        <th className="py-3 px-3">Validade & Dias Restantes</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Gerenciar Quantidade de Dias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182030] text-slate-200">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-500 font-mono">
                            Nenhum membro encontrado com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((c) => {
                          const isExpired = c.expiresAt ? c.expiresAt <= now : false;
                          const isMaster = c.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                          const daysLeft = c.expiresAt
                            ? Math.ceil((c.expiresAt - now) / (1000 * 60 * 60 * 24))
                            : null;

                          return (
                            <tr key={c.email} className="hover:bg-[#0E131F]/60 transition-colors">
                              {/* Member info */}
                              <td className="py-3.5 px-4 font-mono font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <span>{c.email}</span>
                                  {isMaster && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-black">
                                      ADM MASTER
                                    </span>
                                  )}
                                </div>
                                {c.notes && (
                                  <div className="text-[10.5px] text-slate-400 font-sans font-normal mt-0.5">
                                    {c.notes}
                                  </div>
                                )}
                              </td>

                              {/* Origin */}
                              <td className="py-3.5 px-3">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141A26] border border-[#1E2638] text-slate-400">
                                  {c.registeredVia || "HIOVE"}
                                </span>
                              </td>

                              {/* Expiration and days remaining */}
                              <td className="py-3.5 px-3">
                                {c.expiresAt === null ? (
                                  <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-sm">
                                    VITALÍCIO (Ilimitado)
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <div
                                      className={`font-mono text-xs font-bold flex items-center gap-1.5 ${
                                        isExpired ? "text-rose-400" : "text-emerald-400"
                                      }`}
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>
                                        {new Date(c.expiresAt).toLocaleDateString("pt-BR")}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono font-bold">
                                      {isExpired ? (
                                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/25">
                                          EXPIRADO (0 dias)
                                        </span>
                                      ) : daysLeft && daysLeft <= 7 ? (
                                        <span className="text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                                          Restam {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                                          Restam {daysLeft} dias ativos
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-3">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                                    c.status === "BLOCKED"
                                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                      : isExpired
                                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  {c.status === "BLOCKED"
                                    ? "BLOQUEADO"
                                    : isExpired
                                    ? "EXPIRADO"
                                    : "ATIVO"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Botão Principal: Gerenciar Dias */}
                                  <button
                                    type="button"
                                    onClick={() => openDaysManager(c)}
                                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-[#FF7A00]/25 to-amber-500/25 hover:from-[#FF7A00]/40 hover:to-amber-500/40 text-amber-300 border border-[#FF7A00]/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                    title="Abrir painel para alterar dias deste membro"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
                                    <span>Gerenciar Dias</span>
                                  </button>

                                  {/* Quick +7d */}
                                  <button
                                    type="button"
                                    onClick={() => handleAddDaysToCurrent(c.email, 7)}
                                    className="py-1 px-2 rounded-md bg-[#141A26] hover:bg-[#1E2638] text-[10.5px] font-bold text-slate-300 transition-colors cursor-pointer border border-[#1E2638]"
                                    title="Somar +7 dias ao membro"
                                  >
                                    +7d
                                  </button>

                                  {/* Quick +30d */}
                                  <button
                                    type="button"
                                    onClick={() => handleAddDaysToCurrent(c.email, 30)}
                                    className="py-1 px-2 rounded-md bg-[#141A26] hover:bg-[#1E2638] text-[10.5px] font-bold text-emerald-400 transition-colors cursor-pointer border border-[#1E2638]"
                                    title="Somar +30 dias ao membro"
                                  >
                                    +30d
                                  </button>

                                  {/* Quick Lifetime */}
                                  <button
                                    type="button"
                                    onClick={() => handleSetExactDays(c.email, null)}
                                    className="py-1 px-2 rounded-md bg-[#141A26] hover:bg-[#1E2638] text-[10.5px] font-bold text-amber-400 transition-colors cursor-pointer border border-[#1E2638]"
                                    title="Tornar Acesso Vitalício"
                                  >
                                    Vitalício
                                  </button>

                                  {/* Toggle Active / Block */}
                                  {!isMaster && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(c.email)}
                                        className={`p-1.5 rounded-md border text-[10px] transition-colors cursor-pointer ${
                                          c.status === "ACTIVE"
                                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        }`}
                                        title={c.status === "ACTIVE" ? "Bloquear Acesso" : "Desbloquear Acesso"}
                                      >
                                        {c.status === "ACTIVE" ? (
                                          <UserX className="w-3.5 h-3.5" />
                                        ) : (
                                          <UserCheck className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClient(c.email)}
                                        className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                                        title="Excluir Registro de Membro"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DEDICADO: GERENCIAR DIAS DE ACESSO DO MEMBRO SELECIONADO */}
        {managingClient && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
            <div className="relative w-full max-w-lg bg-[#0C1019] border-2 border-[#FF7A00]/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(255,122,0,0.3)] space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center text-[#FF7A00]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Gerenciar Dias de Acesso do Membro
                    </h3>
                    <p className="text-xs font-mono text-amber-400 font-bold">
                      {managingClient.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setManagingClient(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Atual do Membro */}
              <div className="bg-[#070A0F] border border-[#1E2638] rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Situação Atual:</span>
                  <span className="font-mono font-bold text-white">
                    {managingClient.expiresAt === null ? (
                      <strong className="text-amber-300">Vitalício (Sem Expiração)</strong>
                    ) : managingClient.expiresAt <= Date.now() ? (
                      <strong className="text-rose-400">
                        Expirado em {new Date(managingClient.expiresAt).toLocaleDateString("pt-BR")}
                      </strong>
                    ) : (
                      <strong className="text-emerald-400">
                        Ativo até {new Date(managingClient.expiresAt).toLocaleDateString("pt-BR")} (
                        {Math.ceil((managingClient.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))}{" "}
                        dias restantes)
                      </strong>
                    )}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                    managingClient.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {managingClient.status}
                </span>
              </div>

              {/* Opção 1: Definir quantidade exata de dias a partir de hoje */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>1. Definir quantidade exata de dias (a partir de hoje):</span>
                  <span className="text-[10px] text-amber-400 font-mono">mais utilizado</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={inputExactDays}
                    onChange={(e) => setInputExactDays(e.target.value)}
                    className="w-28 bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3 py-2 text-center text-sm font-mono font-black text-amber-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const d = parseInt(inputExactDays, 10);
                      handleSetExactDays(managingClient.email, isNaN(d) ? 30 : d);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#FF7A00] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wide cursor-pointer transition-all shadow-md"
                  >
                    Definir {inputExactDays} Dias
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[3, 7, 15, 30, 45, 60, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setInputExactDays(d.toString());
                        handleSetExactDays(managingClient.email, d);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#141A26] hover:bg-[#1E2638] border border-[#1E2638] text-[10.5px] font-mono text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Opção 2: Somar / Subtrair dias do prazo atual */}
              <div className="space-y-2 pt-2 border-t border-[#182030]">
                <label className="text-xs font-bold text-slate-200 block">
                  2. Somar ou subtrair do prazo de vencimento atual:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { label: "+7 Dias", val: 7, color: "text-emerald-300" },
                    { label: "+15 Dias", val: 15, color: "text-emerald-300" },
                    { label: "+30 Dias", val: 30, color: "text-emerald-300" },
                    { label: "+60 Dias", val: 60, color: "text-emerald-300" },
                    { label: "-7 Dias", val: -7, color: "text-rose-300" },
                    { label: "-15 Dias", val: -15, color: "text-rose-300" },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleAddDaysToCurrent(managingClient.email, btn.val)}
                      className={`py-1.5 px-2 rounded-lg bg-[#141A26] hover:bg-[#1E2638] border border-[#1E2638] text-xs font-bold font-mono ${btn.color} cursor-pointer transition-all`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opção 3: Selecionar data no calendário */}
              <div className="space-y-2 pt-2 border-t border-[#182030]">
                <label className="text-xs font-bold text-slate-200 block">
                  3. Ou definir uma data específica no calendário:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={inputCalendarDate}
                    onChange={(e) => setInputCalendarDate(e.target.value)}
                    className="flex-1 bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSetCalendarDate(managingClient.email)}
                    disabled={!inputCalendarDate}
                    className="py-2 px-3 rounded-xl bg-[#141A26] hover:bg-[#1E2638] text-xs font-bold text-slate-200 border border-[#1E2638] cursor-pointer transition-all disabled:opacity-40"
                  >
                    Salvar Data
                  </button>
                </div>
              </div>

              {/* Opção 4: Ações Especiais: Vitalício / Zerar */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#182030]">
                <button
                  type="button"
                  onClick={() => handleSetExactDays(managingClient.email, null)}
                  className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-black text-xs cursor-pointer transition-all"
                >
                  Tornar Vitalício
                </button>

                <button
                  type="button"
                  onClick={() => handleSetExactDays(managingClient.email, 0)}
                  className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs cursor-pointer transition-all"
                >
                  Zerar / Expirar Agora
                </button>
              </div>

              {/* Opção 5: Observações do Membro */}
              <div className="space-y-1.5 pt-2 border-t border-[#182030]">
                <label className="text-xs font-bold text-slate-300 block">
                  Observações do Membro:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Adicionar notas para este membro..."
                    className="flex-1 bg-[#070A0F] border border-[#1E2638] focus:border-[#FF7A00] rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(managingClient.email)}
                    className="py-1.5 px-3 rounded-xl bg-[#141A26] hover:bg-[#1E2638] text-xs font-bold text-slate-300 border border-[#1E2638] cursor-pointer"
                  >
                    Salvar Nota
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setManagingClient(null)}
                  className="w-full py-2.5 rounded-xl bg-[#141A26] hover:bg-[#1E2638] text-xs font-bold text-slate-300 cursor-pointer transition-colors border border-[#1E2638]"
                >
                  Concluir e Voltar à Lista
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
