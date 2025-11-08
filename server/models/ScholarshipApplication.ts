import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Student from "./Student";
import Scholarship from "./Scholarship";

interface ScholarshipApplicationAttributes {
  scholarship_application_id: string;
  student_id: string;
  scholarship_id: string;
  status?: "pending" | "approved" | "denied";
  remarks?: string;
  document_url: string[];
  applied_at?: Date;
  updated_at?: Date;
}

interface ApplicationAttributes extends Optional<ScholarshipApplicationAttributes, "scholarship_application_id"> {}

class ScholarshipApplication extends Model<ScholarshipApplicationAttributes, ApplicationAttributes> implements ScholarshipApplicationAttributes {
  public scholarship_application_id!: string;
  public student_id!: string;
  public scholarship_id!: string;
  public status?: "pending" | "approved" | "denied";
  public remarks?: string;
  public document_url!: string[];
  public readonly applied_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any) {
    ScholarshipApplication.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
    });
    ScholarshipApplication.belongsTo(models.Scholarship, {
      foreignKey: "scholarship_id",
      as: "scholarship",
    });
  }
}

ScholarshipApplication.init(
  {
    scholarship_application_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, 
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
    status: {
      type: DataTypes.ENUM("pending", "approved", "denied"),
      allowNull: true,
      defaultValue: "pending",
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    document_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ScholarshipApplication",
    tableName: "scholarship_applications",
    timestamps: true, 
    createdAt: "applied_at", 
    updatedAt: "updated_at",
  }
);

export default ScholarshipApplication;