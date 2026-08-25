import { useParams } from "react-router-dom";
import ProductForm from "./ProductForm";

const EditProduct = () => {
  const { id } = useParams();
  return <ProductForm mode="edit" productId={id} />;
};

export default EditProduct;
