package com.uniovi.tests.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;


public class PO_PrivateView extends PO_NavView{
	static public void fillFormAddMark(WebDriver driver, int userOrder, String descriptionp, String scorep)
	{	
		//Espero por que se cargue el formulario de asñadir nota (Concretamente el botón class="btn")
		PO_View.checkElement(driver, "class", "btn");
		//Seleccionamos el alumnos userOrder
	    new Select (driver.findElement(By.id("user"))).selectByIndex(userOrder);
	    //Rellenemos el campo de descripción
	    WebElement description = driver.findElement(By.name("description"));
		description.clear();
		description.sendKeys(descriptionp);
		WebElement score = driver.findElement(By.name("score"));
		score.click();
		score.clear();
		score.sendKeys(scorep);
		By boton = By.className("btn");
		driver.findElement(boton).click();	
	}
	
	static public void login(WebDriver driver, String emailp, String password) {
		clickOptionWithId(driver, "login", "id");
		PO_LoginView.fillForm(driver, emailp , password);
	}
	
	static public void signup(WebDriver driver, String emailp, String namep, String surnamep, String passwordp, String passwordRp) {
		clickOptionWithId(driver, "signup", "id");
		PO_RegisterView.fillForm(driver, emailp, namep, surnamep, passwordp, passwordRp);
	}
	
	static public void logout(WebDriver driver) {
		clickOptionWithId(driver, "logout", "id");
	}
	
	static public void logoutREST(WebDriver driver) {
		driver.manage().deleteAllCookies();
		driver.navigate().to("https://localhost:8081/cliente.html");
	}
	
	
	static public double getMoney(WebDriver driver) {
		WebElement money = driver.findElement(By.id("mDinero"));		
		return Double.parseDouble(money.getText().split(":")[1]);
	}
}