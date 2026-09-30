import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from './ui/breadcrumb';
export function AppBreadcrumbs({ title }: { title: string }) {
  return (
    <Breadcrumb aria-label="Current section">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="shell-page-title">{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
