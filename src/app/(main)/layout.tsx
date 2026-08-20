export default function MainLayout({ children }: LayoutProps<"/">) {
  return <main className="flex min-h-dvh flex-col">{children}</main>;
}
