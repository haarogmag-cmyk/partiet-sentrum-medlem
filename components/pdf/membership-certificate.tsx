/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registrer en standard font (Helvetica er innebygd, men vi bruker standard her)
// Du kan laste inn custom fonts hvis du vil være fancy senere.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fffcf1', // Vår kremhvite bakgrunn
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 40,
    borderBottom: '2px solid #c93960',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c93960',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: '#5e1639',
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 15,
    fontFamily: 'Helvetica-Bold',
  },
  card: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#c93960',
    color: 'white',
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardLabel: {
    fontSize: 8,
    opacity: 0.8,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#94a3b8',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 20,
  },
});

interface Props {
  member: any;
  orgName: string;
  year: number;
}

export const MembershipCertificate = ({ member, orgName, year }: Props) => {
  const isPaid = member.payment_status_ps === 'active';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{orgName}</Text>
          <Text style={styles.subtitle}>Medlemsbevis & Kvittering {year}</Text>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Navn</Text>
          <Text style={styles.value}>{member.first_name} {member.last_name}</Text>

          <Text style={styles.label}>Medlemsnummer</Text>
          <Text style={styles.value}>{member.id}</Text>

          <Text style={styles.label}>Lokallag</Text>
          <Text style={styles.value}>{member.lokallag_navn?.replace('Partiet Sentrum ', '') || 'Ikke tildelt'}</Text>

          <Text style={styles.label}>Status</Text>
          <Text style={{ ...styles.value, color: isPaid ? '#16a34a' : '#dc2626' }}>
            {isPaid ? 'BETALT / GYLDIG' : 'IKKE BETALT'}
          </Text>
        </View>

        {/* Medlemskort-lookalike */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MEDLEMSKORT {year}</Text>
          <View style={styles.cardRow}>
             <View>
                <Text style={styles.cardLabel}>NAVN</Text>
                <Text style={styles.cardValue}>{member.first_name} {member.last_name}</Text>
             </View>
             <View>
                <Text style={styles.cardLabel}>ORG</Text>
                <Text style={styles.cardValue}>{orgName}</Text>
             </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Dette dokumentet er generert automatisk fra Partiet Sentrums medlemsregister.</Text>
          <Text>Dato: {new Date().toLocaleDateString('no-NO')}</Text>
        </View>
      </Page>
    </Document>
  );
};