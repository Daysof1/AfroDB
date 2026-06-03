/**
 * Pantalla HOME
 * Pantalla principal con dos tarjetas grandes (Productos y Servicios) y características
 */

import { useState, useEffect } from "react";
import { Image, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, View, Dimensions } from "react-native";
import catalogoService from "../../src/services/catalogoService";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from '../../components/themed-text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
//Card_gap espaci horizontal entre las dos columnas de la tarjeta de producto
const CARD_GAP = 10;
//CARD_WIDTH ancho de cada tarjeta calculando para que quepan exactamente 2 por fila en dos columnas
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) /2;
//ITEMS_POR_PAGINA numro de productos por agin a usando paginacion 

// Layout para tarjetas de características: dos columnas (2 arriba, 2 abajo)
const FEATURE_GAP = 10;
const FEATURE_CARD_WIDTH = (SCREEN_WIDTH - 32 - FEATURE_GAP) / 2;

const FEATURES = [
  { icon: 'bag-handle', title: 'Tienda Online', desc: 'Compra productos de belleza naturales y de calidad', color: '#553e30', bg: '#efe0d1' },
  { icon: 'cut', title: 'Profesionales Certificados', desc: 'Especialistas en cuidado personal y belleza', color: '#553e30', bg: '#efe0d1' },
  { icon: 'calendar-clear', title: 'Agenda Citas Fácil', desc: 'Reserva tus servicios de forma rápida y segura', color: '#553e30', bg: '#efe0d1' },
  { icon: 'leaf', title: '100% Natural', desc: 'Productos y servicios con ingredientes naturales', color: '#553e30', bg: '#efe0d1' },
] as const;

const AFRODB_IMAGE = catalogoService.buildImageUrl('uploads/fondo.png');

export default function HomeScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          colors={['#a57c63']}
          tintColor="#a57c63"
        />
      }>
      {/* HERO BANNER */}
      <ImageBackground source={{ uri: AFRODB_IMAGE }} style={styles.hero} imageStyle={{ borderRadius: 24 }}>
        <View style={styles.heroOverlay} />
        <ThemedText style={styles.heroLabel}>BIENVENIDO A AFRODB</ThemedText>
        <ThemedText style={styles.heroTitle}>Elige tu categoría</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Explora nuestros productos de belleza o reserva servicios profesionales.
        </ThemedText>
      </ImageBackground>

      {/* CARACTERÍSTICAS */}
      <ThemedText style={styles.sectionTitle}>Nuestras Características</ThemedText>
      <View style={styles.featuresRow}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.featureCard, { width: FEATURE_CARD_WIDTH, marginBottom: FEATURE_GAP }]}>
            <View style={[styles.featureIconCircle, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon as any} size={22} color={f.color} />
            </View>
            <ThemedText style={styles.featureTitle}>{f.title}</ThemedText>
            <ThemedText style={styles.featureDesc}>{f.desc}</ThemedText>
          </View>
        ))}
      </View>


      {/* CATEGORÍAS */}
      <View style={styles.categoriesRow}>
        {/* Tarjeta de Productos */}
        <Pressable
          style={styles.categoryCard}
          onPress={() => router.push('/(tabs)/productos')}>
          <View style={[styles.categoryCardIcon, { backgroundColor: '#ffff' }]}>
            <Ionicons name="bag-handle" size={40} color="#553e30" />
          </View>
          <ThemedText style={styles.categoryCardTitle}>Productos</ThemedText>
          <ThemedText style={styles.categoryCardDesc}>
            Tienda de belleza natural
          </ThemedText>
        </Pressable>

        {/* Tarjeta de Servicios */}
        <Pressable
          style={styles.categoryCard}
          onPress={() => router.push('/(tabs)/servicios')}>
          <View style={[styles.categoryCardIcon, { backgroundColor: '#ffff' }]}>
            <Ionicons name="cut" size={40} color="#553e30" />
          </View>
          <ThemedText style={styles.categoryCardTitle}>Servicios</ThemedText>
          <ThemedText style={styles.categoryCardDesc}>
            Profesionales certificados
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  hero: { borderRadius: 24, padding: 22, backgroundColor: '#a57c63', marginTop: 16, marginBottom: 16, gap: 10 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.28)' },
  heroLabel: { color: '#f3e6d8', letterSpacing: 1.4, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  heroSubtitle: { color: '#f9f6f2', fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#3e2f25', marginBottom: 12 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 4, marginBottom: 24 },
  featureCard: { borderRadius: 16, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#efe6dc', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 6 },
  featureIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontWeight: '700', fontSize: 13, color: '#3e2f25' },
  featureDesc: { fontSize: 11, color: '#7b6758' },
  categoriesRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  categoryCard: { flex: 1, borderRadius: 18, backgroundColor: '#f1e9e1', borderWidth: 1, borderColor: '#efe6dc', padding: 16, gap: 10, shadowColor: '#a57c63', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  categoryCardIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  categoryCardTitle: { fontSize: 18, fontWeight: '800', color: '#3e2f25' },
  categoryCardDesc: { fontSize: 12, color: '#7b6758', lineHeight: 16 },
});
