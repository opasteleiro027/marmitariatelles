import { formatMoney } from "@/modules/storefront/domain/format-money";
import type {
  AdminCatalogProduct,
  AdminCategory,
} from "../../application/catalog-admin";
import {
  createProductAction,
  toggleSoldOutAction,
  updateProductAction,
} from "../../server/catalog-actions";
import styles from "./catalog-management.module.css";

export function CatalogManagement({
  categories,
  products,
}: {
  categories: AdminCategory[];
  products: AdminCatalogProduct[];
}) {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p>Cardápio</p>
          <h2>Produtos do cardápio</h2>
        </div>
        <span>{products.length} produtos cadastrados</span>
      </div>

      <details className={styles.createPanel}>
        <summary>Cadastrar novo produto</summary>
        <form action={createProductAction} className={styles.productForm}>
          <label>
            Nome
            <input name="name" required maxLength={100} />
          </label>
          <label>
            Categoria
            <select name="categoryId" required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wide}>
            Descrição
            <textarea name="description" required maxLength={280} rows={3} />
          </label>
          <label>
            Preço
            <input name="price" inputMode="decimal" placeholder="28,00" required />
          </label>
          <button type="submit">Cadastrar produto</button>
        </form>
      </details>

      <div className={styles.productList}>
        {products.map((product) => (
          <details className={styles.productRow} key={product.id}>
            <summary>
              <span>
                <strong>{product.name}</strong>
                <small>{product.categoryName}</small>
              </span>
              <span className={product.soldOut ? styles.soldOut : styles.available}>
                {product.soldOut ? "Esgotado" : formatMoney(product.priceInCents)}
              </span>
            </summary>
            <form action={updateProductAction} className={styles.productForm}>
              <input type="hidden" name="id" value={product.id} />
              <label>
                Nome
                <input name="name" defaultValue={product.name} required />
              </label>
              <label>
                Categoria
                <select name="categoryId" defaultValue={product.categoryId}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.wide}>
                Descrição
                <textarea
                  name="description"
                  defaultValue={product.description}
                  required
                  rows={3}
                />
              </label>
              <label>
                Preço
                <input
                  name="price"
                  inputMode="decimal"
                  defaultValue={(product.priceInCents / 100)
                    .toFixed(2)
                    .replace(".", ",")}
                  required
                />
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={product.active}
                />
                Produto ativo
              </label>
              <button type="submit">Salvar alterações</button>
            </form>
            <form action={toggleSoldOutAction} className={styles.soldOutForm}>
              <input type="hidden" name="id" value={product.id} />
              <input
                type="hidden"
                name="soldOut"
                value={String(product.soldOut)}
              />
              <button type="submit">
                {product.soldOut ? "Voltar a vender" : "Marcar como esgotado"}
              </button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}
