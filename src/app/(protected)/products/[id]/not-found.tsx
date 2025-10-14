import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Product not found</h1>
      <p className="text-muted-foreground mb-6">
        The product you are looking for doesn’t exist.
      </p>
      <Link
        href="/products"
        className="text-primary underline underline-offset-4"
      >
        Back to Products
      </Link>
    </div>
  );
}
