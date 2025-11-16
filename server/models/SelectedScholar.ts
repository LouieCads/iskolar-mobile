import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database"; 
import Scholarship from "./Scholarship"
import Student from "./Student"

interface SelectedScholarsAttributes {
  scholar_id: string;
  scholarship_id: string;
  student_id: string;
  created_at?: Date;
  updated_at?: Date;
}

interface SelectedScholarsCreationAttributes extends Optional<SelectedScholarsAttributes, "scholar_id"> {}

class SelectedScholar extends Model<SelectedScholarsAttributes, SelectedScholarsCreationAttributes> implements SelectedScholarsAttributes {
  public scholar_id!: string;
  public scholarship_id!: string;
  public student_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any) {
    SelectedScholar.belongsTo(models.Scholarship, {
      foreignKey: "scholarship_id",
      as: "scholarship",
    });
    SelectedScholar.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });
  }
}

SelectedScholar.init(
  {
    scholar_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scholarship_id: {
      type: DataTypes.UUID,
      allowNull: false, 
      references: { 
        model: Scholarship,
        key: "scholarship_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false, 
      references: { 
        model: Student,
        key: "student_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "SelectedScholar",
    tableName: "selected_scholars",
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
  }
);

export default SelectedScholar;