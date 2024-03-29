import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Form, Input, Modal, Table, notification } from "antd";
import { useEffect, useState } from "react";

const GET_PRODUCTS = gql`
  query GetProducts($page: Int!, $perPage: Int!) {
    products(page: $page, perPage: $perPage) {
      id
      name
      price
      stock
    }
  }
`;

const ADD_PRODUCT = gql`
  mutation AddProduct($name: String!, $price: Float!, $stock: Int!) {
    addProduct(name: $name, price: $price, stock: $stock) {
      id
      name
      price
      stock
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $id: ID!
    $name: String!
    $price: Float!
    $stock: Int!
  ) {
    updateProduct(id: $id, name: $name, price: $price, stock: $stock) {
      id
      name
      price
      stock
    }
  }
`;

const REMOVE_PRODUCT = gql`
  mutation RemoveProduct($id: ID!) {
    removeProduct(id: $id) {
      id
    }
  }
`;

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

const ProductForm = ({
  visible,
  onCreate,
  onCancel,
  initialValues,
}: {
  visible: boolean;
  onCreate: (input: Omit<Product, "id">) => void;
  onCancel: () => void;
  initialValues: Product | null;
}) => {
  const [form] = Form.useForm();
  useEffect(() => {
    form.resetFields();
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.setFieldsValue({
        name: "",
        price: "",
        stock: "",
      });
    }
  }, [visible, initialValues, form]);

  return (
    <Modal
      open={visible}
      title={initialValues ? "Update Product" : "Add New Product"}
      okText={initialValues ? "Update" : "Create"}
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onCreate({
              name: values.name,
              price: parseFloat(values.price),
              stock: parseInt(values.stock),
            });
            form.resetFields();
          })
          .catch((info) => {
            console.log("Validate Failed:", info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={initialValues || undefined}
      >
        <Form.Item
          name="name"
          label="Product Name"
          rules={[
            {
              required: true,
              message: "Please input the name of the product!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="price"
          label="Price"
          rules={[
            {
              required: true,
              message: "Please input the price of the product!",
            },
          ]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item
          name="stock"
          label="Stock"
          rules={[
            {
              required: true,
              message: "Please input the stock of the product!",
            },
          ]}
        >
          <Input type="number" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const InventoryManagement = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: { page, perPage },
  });

  const [addProduct] = useMutation(ADD_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS, variables: { page, perPage } }],
  });

  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS, variables: { page, perPage } }],
  });

  const [removeProduct] = useMutation(REMOVE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS, variables: { page, perPage } }],
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :</p>;

  const handleCreate = async (values: Omit<Product, "id">) => {
    try {
      const { data } = await addProduct({ variables: values });
      notification.success({
        message: "Product added successfully",
        description: `Product ${data.addProduct.name} was added.`,
      });
      setFormVisible(false);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        notification.error({
          message: "Error updating product",
          description: error.message,
        });
      }
    }
  };

  const handleUpdate = async (values: Omit<Product, "id">) => {
    if (!editingProduct) return;
    try {
      const { data } = await updateProduct({
        variables: { ...values, id: editingProduct.id },
      });
      notification.success({
        message: "Product updated successfully",
        description: `Product ${data.updateProduct.name} was updated.`,
      });
      setFormVisible(false);
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        notification.error({
          message: "Error updating product",
          description: error.message,
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeProduct({ variables: { id } });
      notification.success({
        message: "Product removed successfully",
        description: "Product was removed from inventory.",
      });
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        notification.error({
          message: "Error removing product",
          description: error.message,
        });
      }
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <div style={{ color: "red" }}>{text}</div>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (text: string) => <div style={{ color: "green" }}>{text}</div>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (text: string) => <div style={{ color: "blue" }}>{text}</div>,
    },
    {
      title: "Action",
      key: "action",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      render: (_, record: Product) => (
        <span>
          <Button
            type="link"
            onClick={() => {
              setEditingProduct(record);
              setFormVisible(true);
            }}
          >
            Edit
          </Button>
          <Button type="link" onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={() => {
          setFormVisible(true);
          setEditingProduct(null);
        }}
      >
        Add Product
      </Button>
      <Table
        dataSource={data.products}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: perPage,
          onChange: (page, perPage) => {
            setPage(page);
            setPerPage(perPage);
          },
        }}
      />
      <ProductForm
        visible={formVisible}
        onCreate={editingProduct ? handleUpdate : handleCreate}
        onCancel={() => {
          setFormVisible(false);
          setEditingProduct(null);
        }}
        initialValues={editingProduct}
      />
    </div>
  );
};

export default InventoryManagement;
