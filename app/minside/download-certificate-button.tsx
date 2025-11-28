'use client'

import { PDFDownloadLink } from '@react-pdf/renderer';
import { MembershipCertificate } from '@/components/pdf/membership-certificate';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

// Vi legger til 'orgName' her
export default function DownloadCertificateButton({ member, orgName }: { member: any, orgName: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Button variant="outline" size="sm" disabled>Laster...</Button>; 
  }

  const year = new Date().getFullYear();
  const fileName = `medlemsbevis_${orgName.replace(' ', '_')}_${year}.pdf`;

  return (
    <PDFDownloadLink
      document={<MembershipCertificate member={member} orgName={orgName} year={year} />}
      fileName={fileName}
    >
      {({ blob, url, loading, error }) => (
        <Button variant="outline" className="w-full text-xs mt-4" disabled={loading}>
          {loading ? 'Genererer...' : `📄 Last ned bevis (${orgName})`}
        </Button>
      )}
    </PDFDownloadLink>
  );
}