import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { adjustInventory, initDb, listAcademicItems, listInventory, seedSubjects, upsertPronoteItems } from './src/db';
import type { AcademicItem, InventoryItem } from './src/domain';
import { mergePronoteItems } from './src/domain';
import { mockPronote } from './src/pronote';
import { scheduleDailyPackingReminder } from './src/notifications';

const categories = ['Tous', 'Cours', 'Papeterie', 'Informatique'];

function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [category, setCategory] = useState('Tous');
  const [lowOnly, setLowOnly] = useState(false);

  const refresh = () => setItems(listInventory());
  useEffect(() => refresh(), []);

  const filtered = useMemo(() => items.filter((item) =>
    (category === 'Tous' || item.category === category) &&
    (!lowOnly || item.quantity <= item.lowStockThreshold),
  ), [items, category, lowOnly]);

  const change = (id: string, delta: number) => {
    adjustInventory(id, delta);
    refresh();
  };

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Ma chambre</Text>
    <View style={styles.rowWrap}>
      {categories.map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
      <Chip label="Stock faible" active={lowOnly} onPress={() => setLowOnly(!lowOnly)} />
    </View>
    {filtered.map((item) => <View key={item.id} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.muted}>{item.category} · seuil {item.lowStockThreshold}</Text>
      </View>
      <TouchableOpacity style={styles.qtyButton} onPress={() => change(item.id, -1)}><Text>−</Text></TouchableOpacity>
      <Text style={styles.quantity}>{item.quantity}</Text>
      <TouchableOpacity style={styles.qtyButton} onPress={() => change(item.id, 1)}><Text>+</Text></TouchableOpacity>
    </View>)}
    {filtered.length === 0 && <Text style={styles.muted}>Aucun article correspondant.</Text>}
  </ScrollView>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <Text style={active ? styles.chipTextActive : styles.chipText}>{label}</Text>
  </TouchableOpacity>;
}

function PlannerScreen() {
  const [items, setItems] = useState<AcademicItem[]>([]);
  const sync = async () => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 7 * 86400000).toISOString();
    const incoming = [
      ...(await mockPronote.fetchSchedule(from, to)),
      ...(await mockPronote.fetchAssignments(from, to)),
    ];
    // Merge only the Pronote partition. Manual records are preserved byte-for-byte.
    const merged = mergePronoteItems(listAcademicItems(from, to), incoming);
    upsertPronoteItems(merged.filter((x) => x.origin === 'pronote'));
    setItems(listAcademicItems(from, to));
  };
  useEffect(() => { sync(); }, []);

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Planning</Text>
    <TouchableOpacity style={styles.primary} onPress={sync}><Text style={styles.primaryText}>Synchroniser Pronote (démo)</Text></TouchableOpacity>
    {items.map((item) => <View key={item.id} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.muted}>{new Date(item.startsAt).toLocaleString('fr-FR')} · {item.kind}</Text>
        {item.notes && <Text style={styles.muted}>{item.notes}</Text>}
      </View>
      <Text style={item.origin === 'manual' ? styles.manual : styles.pronote}>{item.origin}</Text>
    </View>)}
  </ScrollView>;
}

export default function App() {
  const [tab, setTab] = useState<'home' | 'room' | 'planner'>('home');

  useEffect(() => {
    initDb();
    seedSubjects();
    scheduleDailyPackingReminder().catch(() => undefined);
  }, []);

  if (tab === 'room') return <Shell tab={tab} setTab={setTab}><InventoryScreen /></Shell>;
  if (tab === 'planner') return <Shell tab={tab} setTab={setTab}><PlannerScreen /></Shell>;

  return <Shell tab={tab} setTab={setTab}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Bonjour</Text>
    <Text style={styles.subtitle}>Ta journée en un coup d’œil</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>Demain</Text><Text style={styles.muted}>Planning Pronote + tâches manuelles</Text></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Sac</Text><Text style={styles.muted}>Le rappel local est prévu à 19:00.</Text></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Suivi prépa</Text><Text style={styles.muted}>Ajoute tes notes de Khôlles et DS sur /20 avec coefficients.</Text></View>
  </ScrollView></Shell>;
}

function Shell({ children, tab, setTab }: { children: React.ReactNode; tab: string; setTab: (t: 'home' | 'room' | 'planner') => void }) {
  return <SafeAreaView style={styles.safe}>{children}<View style={styles.nav}>
    {(['home', 'room', 'planner'] as const).map((t) => <TouchableOpacity key={t} style={styles.navItem} onPress={() => setTab(t)}>
      <Text style={tab === t ? styles.navActive : styles.navText}>{t === 'home' ? 'Accueil' : t === 'room' ? 'Ma chambre' : 'Planning'}</Text>
    </TouchableOpacity>)}
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F8' },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 2 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  muted: { color: '#707070', marginTop: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#EAEAEA' },
  chipActive: { backgroundColor: '#222' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#FFF' },
  qtyButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAEAEA', alignItems: 'center', justifyContent: 'center' },
  quantity: { width: 24, textAlign: 'center', fontWeight: '700' },
  primary: { backgroundColor: '#222', padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '600' },
  pronote: { fontSize: 11, color: '#555' },
  manual: { fontSize: 11, color: '#111', fontWeight: '700' },
  nav: { height: 70, borderTopWidth: 1, borderTopColor: '#DDD', backgroundColor: '#FFF', flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#777' },
  navActive: { color: '#111', fontWeight: '700' },
});
