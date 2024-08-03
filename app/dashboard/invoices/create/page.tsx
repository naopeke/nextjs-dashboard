import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice create',
};

export default async function Page() {
  const customers = await fetchCustomers();
 
  return (
    <main>
    {/* パンくずリストは、現在のページの位置を示すためのナビゲーション補助ツールで、ユーザーがサイトの階層構造を理解しやすくするために使われます。 */}
    {/* 各オブジェクトは、label（表示テキスト）、href（リンク先）、およびactive（現在のページを示すフラグ）を持っています。 */}
      <Breadcrumbs
        breadcrumbs={[

        // 最初の項目は「Invoices」というラベルで、/dashboard/invoicesへのリンクになっています。
          { label: 'Invoices', href: '/dashboard/invoices' },
        //2番目の項目は「Create Invoice」というラベルで、/dashboard/invoices/createへのリンクになっています。この項目にはactive: trueが設定されており、現在のページが「Create Invoice」であることを示しています。
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}